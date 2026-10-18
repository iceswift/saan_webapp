"use server";

import { z } from "zod";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import { cancelCustomerOrder, runCustomerPayment } from "../payment-service";
import { createOrderReview } from "../review-service";
import {
  geoSchema,
  idSchema,
  uploadUrlSchema,
  newOrderCode,
  NOT_LOGGED_IN,
  parseInput,
  refreshAll,
} from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  AREA_CODES,
  DEPOSIT_RATE,
  PLACE_TYPE_CODES,
  type PaymentMethod,
} from "@/lib/constants";
import { distanceKm } from "@/lib/geo";

const methodSchema = z.enum(["PROMPTPAY", "CARD"], "เลือกวิธีชำระเงิน");

function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

const installSchema = z.object({
  productId: idSchema,
  packageIds: z.array(idSchema).max(10),
  placeType: z.enum(PLACE_TYPE_CODES, "เลือกประเภทสถานที่"),
  area: z.enum(AREA_CODES, "เลือกพื้นที่"),
  address: z.string().trim().min(5, "กรอกที่อยู่สำหรับตั้งศาล").max(500),
  preferredDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง"))
    .min(1, "เลือกวันที่สะดวกอย่างน้อย 1 วัน")
    .max(3, "เลือกได้ไม่เกิน 3 วัน"),
  note: z.string().trim().max(1000).optional(),
  geo: geoSchema.optional(),
});

/**
 * สร้างคำสั่งตั้งศาลใหม่ สถานะเริ่มต้นคือรอจ่ายมัดจำ
 * ศาลและบริการเสริมต้องมาจากร้านเดียวกัน และร้านต้องให้บริการในพื้นที่ที่เลือก
 */
export async function createInstallOrder(input: {
  productId: string;
  packageIds: string[];
  placeType: string;
  area: string;
  address: string;
  preferredDates: string[];
  note?: string;
  geo?: { lat: number; lng: number };
}): Promise<ActionResult<{ orderId: string }>> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(installSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  const today = todayInBangkok();
  if (data.preferredDates.some((d) => d <= today)) {
    return fail("วันที่สะดวกต้องเป็นวันพรุ่งนี้เป็นต้นไป");
  }

  const product = await db.product.findFirst({
    where: { id: data.productId, active: true, provider: { status: "VERIFIED" } },
    include: { provider: true },
  });
  if (!product) return fail("ไม่พบศาลที่เลือก หรือร้านปิดขายแล้ว");

  const areas: string[] = JSON.parse(product.provider.areas);
  if (!areas.includes(data.area)) return fail("ร้านนี้ยังไม่ให้บริการในพื้นที่ที่เลือก");

  // รัศมีบริการ: ตรวจเมื่อทั้งร้านและลูกค้าระบุตำแหน่ง
  const { baseLat, baseLng, serviceRadiusKm } = product.provider;
  if (data.geo && baseLat !== null && baseLng !== null && serviceRadiusKm) {
    const km = distanceKm({ lat: baseLat, lng: baseLng }, data.geo);
    if (km > serviceRadiusKm) {
      return fail(
        `ที่ตั้งศาลอยู่ห่างจากร้านประมาณ ${Math.round(km)} กม. ร้านนี้รับงานในรัศมี ${serviceRadiusKm} กม.`,
      );
    }
  }

  // ปฏิทินวันว่าง: ต้องมีอย่างน้อยหนึ่งวันที่ร้านรับงานได้
  const blocked = await db.providerBlockedDate.findMany({
    where: { providerId: product.providerId, date: { in: data.preferredDates } },
    select: { date: true },
  });
  if (blocked.length === data.preferredDates.length) {
    return fail("ร้านไม่ว่างในวันที่เลือก กรุณาเลือกวันอื่น");
  }

  const packageIds = [...new Set(data.packageIds)];
  const packages = await db.servicePackage.findMany({
    where: { id: { in: packageIds }, providerId: product.providerId, active: true },
  });
  if (packages.length !== packageIds.length) return fail("บริการเสริมบางรายการไม่พร้อมให้บริการ");

  const total = product.price + packages.reduce((sum, p) => sum + p.price, 0);
  const deposit = Math.round(total * DEPOSIT_RATE);
  const code = await newOrderCode();

  const order = await db.order.create({
    data: {
      code,
      userId: user.id,
      providerId: product.providerId,
      type: "INSTALL",
      shrineKind: product.kind,
      placeType: data.placeType,
      area: data.area,
      address: data.address,
      lat: data.geo?.lat ?? null,
      lng: data.geo?.lng ?? null,
      note: data.note ?? "",
      preferredDates: JSON.stringify([...data.preferredDates].sort()),
      total,
      deposit,
      items: {
        create: [
          { name: product.name, price: product.price, productId: product.id },
          ...packages.map((p) => ({ name: p.name, price: p.price, packageId: p.id })),
        ],
      },
      events: { create: { title: "สร้างคำสั่งซื้อ", byRole: "CUSTOMER" } },
    },
  });

  refreshAll();
  return ok({ orderId: order.id });
}

/** จ่ายมัดจำ หลังจ่ายสำเร็จคำสั่งจะถูกส่งให้ร้านยืนยัน */
export async function payDeposit(input: {
  orderId: string;
  method: PaymentMethod;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ orderId: idSchema, method: methodSchema }), input);
  if (!parsed.ok) return parsed;
  const { orderId, method } = parsed.data;

  const result = await runCustomerPayment({ orderId, method, userId: user.id, kind: "PAYMENT_DEPOSIT" });
  if (result.ok) refreshAll();
  return result;
}

/** ลูกค้ายกเลิกได้จนกว่าร้านจะยืนยันคำสั่ง */
export async function cancelOrder(input: { orderId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ orderId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const result = await cancelCustomerOrder(parsed.data.orderId, user.id);
  if (result.ok) refreshAll();
  return result;
}

/**
 * ลูกค้าตรวจรับงานและจ่ายส่วนที่เหลือ
 * คำสั่งตั้งศาลใหม่จะเพิ่มศาลเข้า "ศาลของฉัน" ให้อัตโนมัติ
 */
export async function confirmCompletion(input: {
  orderId: string;
  method: PaymentMethod;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ orderId: idSchema, method: methodSchema }), input);
  if (!parsed.ok) return parsed;
  const { orderId, method } = parsed.data;

  const result = await runCustomerPayment({ orderId, method, userId: user.id, kind: "PAYMENT_BALANCE" });
  if (result.ok) refreshAll();
  return result;
}

/** รีวิวได้ครั้งเดียว หลังคำสั่งเสร็จสมบูรณ์ */
export async function submitReview(input: {
  orderId: string;
  rating: number;
  comment?: string;
  photoUrls?: string[];
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({
      orderId: idSchema,
      rating: z.number().int().min(1, "ให้คะแนน 1 ถึง 5 ดาว").max(5, "ให้คะแนน 1 ถึง 5 ดาว"),
      comment: z.string().trim().max(1000).optional(),
      photoUrls: z.array(uploadUrlSchema).max(4, "แนบรูปได้ไม่เกิน 4 รูป").optional(),
    }),
    input,
  );
  if (!parsed.ok) return parsed;
  const result = await createOrderReview({ ...parsed.data, userId: user.id });
  if (!result.ok) return result;
  refreshAll();
  return result;
}
