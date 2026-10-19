"use server";

import { z } from "zod";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import {
  geoSchema,
  idSchema,
  newOrderCode,
  notify,
  NOT_ALLOWED,
  NOT_LOGGED_IN,
  parseInput,
  refreshAll,
  uploadUrlSchema,
} from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";
import { AREA_CODES, DEPOSIT_RATE, REQUEST_TYPES, SHRINE_KIND_CODES } from "@/lib/constants";
import { saveOwnedVowLocation } from "../vow-location";

// ---------- คำขอใบเสนอราคา (ถอน ย้าย ซ่อม) ----------

const requestSchema = z.object({
  type: z.enum(["REMOVE", "REPAIR"], "เลือกประเภทงาน"),
  description: z.string().trim().min(10, "อธิบายงานที่ต้องการอย่างน้อย 10 ตัวอักษร").max(2000),
  area: z.enum(AREA_CODES, "เลือกพื้นที่"),
  address: z.string().trim().min(5, "กรอกที่อยู่").max(500),
  photoUrls: z.array(uploadUrlSchema).max(6, "แนบรูปได้ไม่เกิน 6 รูป"),
  shrineId: idSchema.optional(),
  geo: geoSchema.optional(),
});

/** ส่งคำขอให้ร้านในพื้นที่เสนอราคา */
export async function createRequest(input: {
  type: "REMOVE" | "REPAIR";
  description: string;
  area: string;
  address: string;
  photoUrls: string[];
  shrineId?: string;
  geo?: { lat: number; lng: number };
}): Promise<ActionResult<{ requestId: string }>> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(requestSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  if (data.shrineId) {
    const shrine = await db.shrine.findFirst({ where: { id: data.shrineId, userId: user.id } });
    if (!shrine) return fail("ไม่พบศาลที่เลือก");
  }

  const request = await db.serviceRequest.create({
    data: {
      userId: user.id,
      shrineId: data.shrineId ?? null,
      type: data.type,
      description: data.description,
      area: data.area,
      address: data.address,
      lat: data.geo?.lat ?? null,
      lng: data.geo?.lng ?? null,
      photoUrls: JSON.stringify(data.photoUrls),
    },
  });

  refreshAll();
  return ok({ requestId: request.id });
}

/** ลูกค้าปิดคำขอที่ยังไม่ได้เลือกร้าน */
export async function closeRequest(input: { requestId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ requestId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const request = await db.serviceRequest.findUnique({ where: { id: parsed.data.requestId } });
  if (!request || request.userId !== user.id) return NOT_ALLOWED;
  if (request.status !== "OPEN") return fail("คำขอนี้ปิดไปแล้ว");

  await db.serviceRequest.update({ where: { id: request.id }, data: { status: "CLOSED" } });
  refreshAll();
  return ok();
}

/** เลือกใบเสนอราคา ระบบจะสร้างคำสั่งที่รอจ่ายมัดจำให้ */
export async function acceptQuote(input: {
  quoteId: string;
}): Promise<ActionResult<{ orderId: string }>> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ quoteId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const quote = await db.quote.findUnique({
    where: { id: parsed.data.quoteId },
    include: { request: true, provider: true },
  });
  if (!quote || quote.request.userId !== user.id) return NOT_ALLOWED;
  if (quote.request.status !== "OPEN" || quote.status !== "SENT") {
    return fail("ใบเสนอราคานี้ใช้ไม่ได้แล้ว");
  }
  if (quote.provider.status !== "VERIFIED") return fail("ร้านนี้ไม่พร้อมรับงานในขณะนี้");

  const request = quote.request;
  const code = await newOrderCode();
  const order = await db.$transaction(async (tx) => {
    await tx.quote.updateMany({
      where: { requestId: request.id, id: { not: quote.id } },
      data: { status: "DECLINED" },
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
    await tx.serviceRequest.update({ where: { id: request.id }, data: { status: "ACCEPTED" } });
    await notify(tx, quote.provider.userId, "QUOTE", "ลูกค้าเลือกใบเสนอราคาของคุณ", {
      body: "งานจะเข้ามาเมื่อลูกค้าจ่ายมัดจำ",
      href: "/provider?tab=orders",
    });
    return tx.order.create({
      data: {
        code,
        userId: user.id,
        providerId: quote.providerId,
        requestId: request.id,
        shrineId: request.shrineId,
        type: request.type,
        area: request.area,
        address: request.address,
        note: request.description,
        total: quote.price,
        deposit: Math.round(quote.price * DEPOSIT_RATE),
        items: {
          create: { name: REQUEST_TYPES[request.type as keyof typeof REQUEST_TYPES], price: quote.price },
        },
        events: { create: { title: "เลือกใบเสนอราคาและสร้างคำสั่งซื้อ", byRole: "CUSTOMER" } },
      },
    });
  });

  refreshAll();
  return ok({ orderId: order.id });
}

// ---------- ศาลของฉัน ----------

const shrineSchema = z.object({
  name: z.string().trim().min(1, "ตั้งชื่อศาล").max(100),
  kind: z.enum(SHRINE_KIND_CODES, "เลือกประเภทศาล"),
  area: z.enum(AREA_CODES, "เลือกพื้นที่"),
  address: z.string().trim().max(500).optional(),
  photoUrl: uploadUrlSchema.optional(),
  installedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง")
    .optional(),
});

/** ลงทะเบียนศาลที่มีอยู่แล้ว */
export async function createShrine(input: {
  name: string;
  kind: string;
  area: string;
  address?: string;
  photoUrl?: string;
  /** วันที่ตั้งศาล รูปแบบ YYYY-MM-DD */
  installedAt?: string;
}): Promise<ActionResult<{ shrineId: string }>> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(shrineSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  const shrine = await db.shrine.create({
    data: {
      userId: user.id,
      name: data.name,
      kind: data.kind,
      area: data.area,
      address: data.address ?? "",
      photoUrl: data.photoUrl ?? null,
      installedAt: data.installedAt ? new Date(`${data.installedAt}T12:00:00+07:00`) : null,
    },
  });

  refreshAll();
  return ok({ shrineId: shrine.id });
}

export async function deleteShrine(input: { shrineId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ shrineId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const result = await db.shrine.deleteMany({
    where: { id: parsed.data.shrineId, userId: user.id },
  });
  if (result.count === 0) return NOT_ALLOWED;

  refreshAll();
  return ok();
}

// ---------- สมุดบน ----------

const vowSchema = z.object({
  location: geoSchema.nullable().optional(),
  place: z.string().trim().min(1, "กรอกว่าบนไว้กับใคร ที่ไหน").max(200),
  wish: z.string().trim().max(500).optional(),
  promise: z.string().trim().min(1, "กรอกสิ่งที่สัญญาว่าจะถวาย").max(500),
  remindAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง")
    .optional(),
});

export async function createVow(input: {
  location?: { lat: number; lng: number } | null;
  place: string;
  wish?: string;
  promise: string;
  /** วันที่ขอให้เตือน รูปแบบ YYYY-MM-DD */
  remindAt?: string;
}): Promise<ActionResult<{ vowId: string }>> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(vowSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  const vow = await db.vow.create({
    data: {
      userId: user.id,
      place: data.place,
      lat: data.location ? Math.round(data.location.lat * 1e6) / 1e6 : null,
      lng: data.location ? Math.round(data.location.lng * 1e6) / 1e6 : null,
      wish: data.wish ?? "",
      promise: data.promise,
      remindAt: data.remindAt ? new Date(`${data.remindAt}T12:00:00+07:00`) : null,
    },
  });

  refreshAll();
  return ok({ vowId: vow.id });
}

export async function setVowLocation(input: { vowId: string; location: { lat: number; lng: number } | null }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const result = await saveOwnedVowLocation(user.id, input);
  if (result.ok) refreshAll();
  return result;
}

/** เปลี่ยนสถานะการบน: WAITING รอผล, GRANTED สมหวังแล้ว, FULFILLED แก้บนแล้ว */
export async function setVowStatus(input: {
  vowId: string;
  status: "WAITING" | "GRANTED" | "FULFILLED";
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({ vowId: idSchema, status: z.enum(["WAITING", "GRANTED", "FULFILLED"]) }),
    input,
  );
  if (!parsed.ok) return parsed;

  const result = await db.vow.updateMany({
    where: { id: parsed.data.vowId, userId: user.id },
    data: { status: parsed.data.status },
  });
  if (result.count === 0) return NOT_ALLOWED;

  refreshAll();
  return ok();
}

export async function deleteVow(input: { vowId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ vowId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const result = await db.vow.deleteMany({ where: { id: parsed.data.vowId, userId: user.id } });
  if (result.count === 0) return NOT_ALLOWED;

  refreshAll();
  return ok();
}
