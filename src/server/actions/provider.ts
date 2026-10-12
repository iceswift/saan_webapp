"use server";

import { z } from "zod";
import type { Provider } from "@prisma/client";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import {
  addEvent,
  idSchema,
  notify,
  NOT_ALLOWED,
  NOT_LOGGED_IN,
  parseInput,
  phoneSchema,
  priceSchema,
  refreshAll,
  uploadUrlSchema,
} from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  AREA_CODES,
  PACKAGE_TYPE_CODES,
  PROVIDER_KIND_CODES,
  SHRINE_KIND_CODES,
} from "@/lib/constants";
import { formatBaht, formatDateTime } from "@/lib/format";

const NOT_PROVIDER = fail("กรุณาสมัครเป็นผู้ให้บริการก่อน");
const NOT_VERIFIED = fail("บัญชีผู้ให้บริการยังไม่ผ่านการตรวจสอบ");

async function myProvider(): Promise<Provider | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.provider.findUnique({ where: { userId: user.id } });
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "กรอกชื่อร้านหรือชื่อผู้ให้บริการ").max(100),
  kind: z.enum(PROVIDER_KIND_CODES, "เลือกประเภทผู้ให้บริการ"),
  description: z.string().trim().max(1000).optional(),
  phone: phoneSchema,
  areas: z.array(z.enum(AREA_CODES)).min(1, "เลือกพื้นที่ให้บริการอย่างน้อย 1 พื้นที่"),
});

type ProfileInput = {
  name: string;
  kind: string;
  description?: string;
  phone: string;
  areas: string[];
};

/** สมัครเป็นผู้ให้บริการ บัญชีจะอยู่ในสถานะรอตรวจสอบจนผู้ดูแลระบบอนุมัติ */
export async function registerProvider(input: ProfileInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(profileSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  const existing = await db.provider.findUnique({ where: { userId: user.id } });
  if (existing) return fail("คุณสมัครเป็นผู้ให้บริการแล้ว");

  await db.$transaction(async (tx) => {
    await tx.provider.create({
      data: {
        userId: user.id,
        name: data.name,
        kind: data.kind,
        description: data.description ?? "",
        phone: data.phone,
        areas: JSON.stringify([...new Set(data.areas)]),
      },
    });
    if (user.role === "CUSTOMER") {
      await tx.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });
    }
  });

  refreshAll();
  return ok();
}

export async function updateProviderProfile(input: ProfileInput): Promise<ActionResult> {
  const provider = await myProvider();
  if (!provider) return NOT_PROVIDER;
  const parsed = parseInput(profileSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  await db.provider.update({
    where: { id: provider.id },
    data: {
      name: data.name,
      kind: data.kind,
      description: data.description ?? "",
      phone: data.phone,
      areas: JSON.stringify([...new Set(data.areas)]),
    },
  });

  refreshAll();
  return ok();
}

// ---------- แค็ตตาล็อกของร้าน ----------

const productSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(2, "กรอกชื่อศาล").max(120),
  description: z.string().trim().max(1000).optional(),
  kind: z.enum(SHRINE_KIND_CODES, "เลือกประเภทศาล"),
  price: priceSchema,
  imageUrl: uploadUrlSchema.nullable().optional(),
  active: z.boolean().optional(),
});

/** เพิ่มศาลใหม่ หรือแก้ไขเมื่อส่ง id มาด้วย */
export async function saveProduct(input: {
  id?: string;
  name: string;
  description?: string;
  kind: string;
  price: number;
  imageUrl?: string | null;
  active?: boolean;
}): Promise<ActionResult<{ productId: string }>> {
  const provider = await myProvider();
  if (!provider) return NOT_PROVIDER;
  const parsed = parseInput(productSchema, input);
  if (!parsed.ok) return parsed;
  const { id, ...data } = parsed.data;

  const fields = {
    name: data.name,
    description: data.description ?? "",
    kind: data.kind,
    price: data.price,
    imageUrl: data.imageUrl ?? null,
    active: data.active ?? true,
  };

  if (id) {
    const result = await db.product.updateMany({
      where: { id, providerId: provider.id },
      data: fields,
    });
    if (result.count === 0) return NOT_ALLOWED;
    refreshAll();
    return ok({ productId: id });
  }

  const product = await db.product.create({ data: { ...fields, providerId: provider.id } });
  refreshAll();
  return ok({ productId: product.id });
}

const packageSchema = z.object({
  id: idSchema.optional(),
  type: z.enum(PACKAGE_TYPE_CODES, "เลือกประเภทบริการ"),
  name: z.string().trim().min(2, "กรอกชื่อบริการ").max(120),
  description: z.string().trim().max(1000).optional(),
  price: priceSchema,
  active: z.boolean().optional(),
});

/** เพิ่มบริการเสริมใหม่ หรือแก้ไขเมื่อส่ง id มาด้วย */
export async function savePackage(input: {
  id?: string;
  type: string;
  name: string;
  description?: string;
  price: number;
  active?: boolean;
}): Promise<ActionResult<{ packageId: string }>> {
  const provider = await myProvider();
  if (!provider) return NOT_PROVIDER;
  const parsed = parseInput(packageSchema, input);
  if (!parsed.ok) return parsed;
  const { id, ...data } = parsed.data;

  const fields = {
    type: data.type,
    name: data.name,
    description: data.description ?? "",
    price: data.price,
    active: data.active ?? true,
  };

  if (id) {
    const result = await db.servicePackage.updateMany({
      where: { id, providerId: provider.id },
      data: fields,
    });
    if (result.count === 0) return NOT_ALLOWED;
    refreshAll();
    return ok({ packageId: id });
  }

  const pkg = await db.servicePackage.create({ data: { ...fields, providerId: provider.id } });
  refreshAll();
  return ok({ packageId: pkg.id });
}

// ---------- งานของร้าน ----------

async function myOrder(orderId: string) {
  const provider = await myProvider();
  if (!provider) return { order: null, error: NOT_PROVIDER };
  if (provider.status !== "VERIFIED") return { order: null, error: NOT_VERIFIED };
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.providerId !== provider.id) return { order: null, error: NOT_ALLOWED };
  return { order, error: null };
}

/** ร้านยืนยันรับงานพร้อมกำหนดวันเวลา */
export async function confirmOrder(input: {
  orderId: string;
  /** วันเวลาที่นัด รูปแบบ ISO เช่น 2026-10-24T09:09:00+07:00 */
  scheduledAt: string;
}): Promise<ActionResult> {
  const parsed = parseInput(
    z.object({ orderId: idSchema, scheduledAt: z.iso.datetime({ offset: true, error: "เลือกวันและเวลานัด" }) }),
    input,
  );
  if (!parsed.ok) return parsed;
  const found = await myOrder(parsed.data.orderId);
  if (found.error) return found.error;
  const { order } = found;
  if (order.status !== "AWAITING_PROVIDER") return fail("คำสั่งนี้ยืนยันไม่ได้ในสถานะปัจจุบัน");

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (scheduledAt <= new Date()) return fail("วันนัดต้องเป็นเวลาในอนาคต");

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED", scheduledAt } });
    await addEvent(tx, order.id, "ร้านยืนยันคำสั่ง", "PROVIDER", {
      note: `นัดหมาย ${formatDateTime(scheduledAt)}`,
    });
    await notify(tx, order.userId, "ORDER", "ร้านยืนยันคำสั่งแล้ว", {
      body: `นัดหมาย ${formatDateTime(scheduledAt)}`,
      href: `/orders/${order.id}`,
    });
  });

  refreshAll();
  return ok();
}

/** ร้านปฏิเสธงานก่อนยืนยัน ระบบบันทึกว่าต้องคืนมัดจำ */
export async function declineOrder(input: {
  orderId: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = parseInput(
    z.object({ orderId: idSchema, reason: z.string().trim().min(3, "ระบุเหตุผล").max(500) }),
    input,
  );
  if (!parsed.ok) return parsed;
  const found = await myOrder(parsed.data.orderId);
  if (found.error) return found.error;
  const { order } = found;
  if (order.status !== "AWAITING_PROVIDER") return fail("คำสั่งนี้ปฏิเสธไม่ได้ในสถานะปัจจุบัน");

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await addEvent(tx, order.id, "ร้านไม่สามารถรับงานนี้ได้", "PROVIDER", {
      note: `${parsed.data.reason} ต้องคืนมัดจำ ${formatBaht(order.deposit)} ให้ลูกค้า`,
    });
    await notify(tx, order.userId, "ORDER", "ร้านไม่สามารถรับงานนี้ได้", {
      body: "ทีมงานจะติดต่อเพื่อคืนมัดจำ",
      href: `/orders/${order.id}`,
    });
  });

  refreshAll();
  return ok();
}

/** ร้านรายงานความคืบหน้า แนบรูปได้ */
export async function addOrderEvent(input: {
  orderId: string;
  title: string;
  note?: string;
  photoUrl?: string;
}): Promise<ActionResult> {
  const parsed = parseInput(
    z.object({
      orderId: idSchema,
      title: z.string().trim().min(2, "กรอกหัวข้อความคืบหน้า").max(120),
      note: z.string().trim().max(1000).optional(),
      photoUrl: uploadUrlSchema.optional(),
    }),
    input,
  );
  if (!parsed.ok) return parsed;
  const found = await myOrder(parsed.data.orderId);
  if (found.error) return found.error;
  const { order } = found;
  if (order.status !== "CONFIRMED") return fail("รายงานความคืบหน้าได้หลังยืนยันคำสั่งและก่อนส่งงาน");

  await addEvent(db, order.id, parsed.data.title, "PROVIDER", {
    note: parsed.data.note,
    photoUrl: parsed.data.photoUrl,
  });
  await notify(db, order.userId, "ORDER", parsed.data.title, {
    body: `ความคืบหน้าของคำสั่งเลขที่ ${order.code}`,
    href: `/orders/${order.id}`,
  });

  refreshAll();
  return ok();
}

/** ร้านแจ้งว่างานเสร็จ รอลูกค้าตรวจรับ */
export async function markOrderDone(input: {
  orderId: string;
  photoUrl?: string;
}): Promise<ActionResult> {
  const parsed = parseInput(
    z.object({ orderId: idSchema, photoUrl: uploadUrlSchema.optional() }),
    input,
  );
  if (!parsed.ok) return parsed;
  const found = await myOrder(parsed.data.orderId);
  if (found.error) return found.error;
  const { order } = found;
  if (order.status !== "CONFIRMED") return fail("ส่งงานได้หลังยืนยันคำสั่งแล้วเท่านั้น");

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "DONE" } });
    await addEvent(tx, order.id, "ร้านแจ้งว่างานเสร็จ", "PROVIDER", {
      note: "รอลูกค้าตรวจรับงาน",
      photoUrl: parsed.data.photoUrl,
    });
    await notify(tx, order.userId, "ORDER", "ร้านแจ้งว่างานเสร็จ", {
      body: "กรุณาตรวจงานและยืนยันรับงาน",
      href: `/orders/${order.id}`,
    });
  });

  refreshAll();
  return ok();
}

/** ส่งหรือแก้ไขใบเสนอราคาสำหรับคำขอที่ยังเปิดอยู่ */
export async function sendQuote(input: {
  requestId: string;
  price: number;
  note?: string;
}): Promise<ActionResult> {
  const provider = await myProvider();
  if (!provider) return NOT_PROVIDER;
  if (provider.status !== "VERIFIED") return NOT_VERIFIED;
  const parsed = parseInput(
    z.object({
      requestId: idSchema,
      price: priceSchema,
      note: z.string().trim().max(1000).optional(),
    }),
    input,
  );
  if (!parsed.ok) return parsed;
  const { requestId, price, note } = parsed.data;

  const request = await db.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "OPEN") return fail("คำขอนี้ปิดรับใบเสนอราคาแล้ว");
  const areas: string[] = JSON.parse(provider.areas);
  if (!areas.includes(request.area)) return fail("คำขอนี้อยู่นอกพื้นที่ให้บริการของคุณ");

  await db.quote.upsert({
    where: { requestId_providerId: { requestId, providerId: provider.id } },
    create: { requestId, providerId: provider.id, price, note: note ?? "" },
    update: { price, note: note ?? "", status: "SENT" },
  });
  await notify(db, request.userId, "QUOTE", "มีใบเสนอราคาใหม่", {
    body: `${provider.name} เสนอราคา ${formatBaht(price)}`,
    href: `/requests/${request.id}`,
  });

  refreshAll();
  return ok();
}
