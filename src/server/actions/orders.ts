"use server";

import { z } from "zod";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import { payments } from "../integrations";
import {
  addEvent,
  idSchema,
  newOrderCode,
  notify,
  NOT_ALLOWED,
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
import { formatBaht } from "@/lib/format";

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

  const order = await db.order.findUnique({ where: { id: orderId }, include: { provider: true } });
  if (!order || order.userId !== user.id) return NOT_ALLOWED;
  if (order.status !== "AWAITING_DEPOSIT") return fail("คำสั่งนี้จ่ายมัดจำแล้วหรือถูกยกเลิก");

  let gatewayRef: string;
  try {
    ({ gatewayRef } = await payments.charge({
      amount: order.deposit,
      method,
      reference: `${order.code}-DEPOSIT`,
    }));
  } catch {
    return fail("ชำระเงินไม่สำเร็จ กรุณาลองใหม่");
  }

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId,
        kind: "DEPOSIT",
        amount: order.deposit,
        method,
        status: "PAID",
        gateway: payments.name,
        gatewayRef,
        paidAt: new Date(),
      },
    });
    await tx.order.update({ where: { id: orderId }, data: { status: "AWAITING_PROVIDER" } });
    await addEvent(tx, orderId, "จ่ายมัดจำแล้ว", "CUSTOMER", {
      note: `ได้รับมัดจำ ${formatBaht(order.deposit)}`,
    });
    await notify(tx, order.provider.userId, "ORDER", "มีคำสั่งใหม่รอคุณยืนยัน", {
      body: `เลขที่ ${order.code} ลูกค้าจ่ายมัดจำแล้ว`,
      href: `/provider/orders/${order.id}`,
    });
  });

  refreshAll();
  return ok();
}

/** ลูกค้ายกเลิกได้จนกว่าร้านจะยืนยันคำสั่ง */
export async function cancelOrder(input: { orderId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ orderId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { provider: true },
  });
  if (!order || order.userId !== user.id) return NOT_ALLOWED;
  if (order.status !== "AWAITING_DEPOSIT" && order.status !== "AWAITING_PROVIDER") {
    return fail("ร้านยืนยันคำสั่งแล้ว กรุณาติดต่อร้านเพื่อยกเลิก");
  }

  const hadDeposit = order.status === "AWAITING_PROVIDER";
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await addEvent(tx, order.id, "ลูกค้ายกเลิกคำสั่ง", "CUSTOMER", {
      note: hadDeposit ? `ต้องคืนมัดจำ ${formatBaht(order.deposit)} ให้ลูกค้า` : "",
    });
    if (hadDeposit) {
      await notify(tx, order.provider.userId, "ORDER", "ลูกค้ายกเลิกคำสั่ง", {
        body: `เลขที่ ${order.code}`,
        href: `/provider/orders/${order.id}`,
      });
    }
  });

  refreshAll();
  return ok();
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

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, provider: true },
  });
  if (!order || order.userId !== user.id) return NOT_ALLOWED;
  if (order.status !== "DONE") return fail("ร้านยังไม่ได้แจ้งว่างานเสร็จ");

  const paid = order.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(order.total - paid, 0);

  let gatewayRef = "";
  if (balance > 0) {
    try {
      ({ gatewayRef } = await payments.charge({
        amount: balance,
        method,
        reference: `${order.code}-BALANCE`,
      }));
    } catch {
      return fail("ชำระเงินไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  await db.$transaction(async (tx) => {
    if (balance > 0) {
      await tx.payment.create({
        data: {
          orderId,
          kind: "BALANCE",
          amount: balance,
          method,
          status: "PAID",
          gateway: payments.name,
          gatewayRef,
          paidAt: new Date(),
        },
      });
    }

    let shrineId = order.shrineId;
    if (order.type === "INSTALL" && !shrineId) {
      const shrine = await tx.shrine.create({
        data: {
          userId: user.id,
          name: order.items[0]?.name ?? "ศาลของฉัน",
          kind: order.shrineKind || "PHRA_PHUM",
          area: order.area,
          address: order.address,
          installedAt: order.scheduledAt ?? new Date(),
        },
      });
      shrineId = shrine.id;
    }

    await tx.order.update({ where: { id: orderId }, data: { status: "COMPLETED", shrineId } });
    await addEvent(tx, orderId, "ลูกค้าตรวจรับงานแล้ว", "CUSTOMER", {
      note: balance > 0 ? `จ่ายส่วนที่เหลือ ${formatBaht(balance)}` : "",
    });
    await notify(tx, order.provider.userId, "ORDER", "ลูกค้าตรวจรับงานแล้ว", {
      body: `เลขที่ ${order.code} เสร็จสมบูรณ์`,
      href: `/provider/orders/${order.id}`,
    });
  });

  refreshAll();
  return ok();
}

/** รีวิวได้ครั้งเดียว หลังคำสั่งเสร็จสมบูรณ์ */
export async function submitReview(input: {
  orderId: string;
  rating: number;
  comment?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({
      orderId: idSchema,
      rating: z.number().int().min(1, "ให้คะแนน 1 ถึง 5 ดาว").max(5, "ให้คะแนน 1 ถึง 5 ดาว"),
      comment: z.string().trim().max(1000).optional(),
    }),
    input,
  );
  if (!parsed.ok) return parsed;
  const { orderId, rating, comment } = parsed.data;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { review: true, provider: true },
  });
  if (!order || order.userId !== user.id) return NOT_ALLOWED;
  if (order.status !== "COMPLETED") return fail("รีวิวได้หลังตรวจรับงานแล้ว");
  if (order.review) return fail("คุณรีวิวคำสั่งนี้แล้ว");

  await db.review.create({
    data: { orderId, userId: user.id, providerId: order.providerId, rating, comment: comment ?? "" },
  });
  await notify(db, order.provider.userId, "ORDER", `คุณได้รับรีวิว ${rating} ดาว`, {
    body: `จากคำสั่งเลขที่ ${order.code}`,
    href: `/provider/orders/${order.id}`,
  });

  refreshAll();
  return ok();
}
