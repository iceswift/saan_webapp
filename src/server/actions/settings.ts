"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "../db";
import { destroySession, getCurrentUser } from "../auth";
import { idSchema, NOT_ALLOWED, NOT_LOGGED_IN, parseInput, refreshAll } from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";
import { AREA_CODES } from "@/lib/constants";
import { TEXT_SIZE_COOKIE } from "@/lib/prefs";

const YEAR = 60 * 60 * 24 * 365;

/** เปิดหรือปิดตัวอักษรขนาดใหญ่ ใช้ได้แม้ยังไม่ล็อกอิน (เก็บในเครื่องด้วยคุกกี้) */
export async function setTextSize(input: { large: boolean }): Promise<ActionResult> {
  const parsed = parseInput(z.object({ large: z.boolean() }), input);
  if (!parsed.ok) return parsed;

  const store = await cookies();
  store.set(TEXT_SIZE_COOKIE, parsed.data.large ? "large" : "normal", {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });

  const user = await getCurrentUser();
  if (user) {
    await db.user.update({ where: { id: user.id }, data: { largeText: parsed.data.large } });
  }
  refreshAll();
  return ok();
}

/** เลือกว่าจะรับการแจ้งเตือนในแอปเรื่องใดบ้าง */
export async function updateNotificationSettings(input: {
  notifyOrders: boolean;
  notifyQuotes: boolean;
  notifyVows: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({ notifyOrders: z.boolean(), notifyQuotes: z.boolean(), notifyVows: z.boolean() }),
    input,
  );
  if (!parsed.ok) return parsed;

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  refreshAll();
  return ok();
}

const addressSchema = z.object({
  id: idSchema.optional(),
  label: z.string().trim().min(1, "ตั้งชื่อที่อยู่ เช่น บ้าน").max(40),
  area: z.enum(AREA_CODES, "เลือกพื้นที่"),
  address: z.string().trim().min(5, "กรอกที่อยู่").max(500),
  isDefault: z.boolean().optional(),
});

/** เพิ่มที่อยู่ใหม่ หรือแก้ไขเมื่อส่ง id มาด้วย ที่อยู่แรกจะเป็นที่อยู่หลักอัตโนมัติ */
export async function saveAddress(input: {
  id?: string;
  label: string;
  area: string;
  address: string;
  isDefault?: boolean;
}): Promise<ActionResult<{ addressId: string }>> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(addressSchema, input);
  if (!parsed.ok) return parsed;
  const { id, ...data } = parsed.data;

  const count = await db.address.count({ where: { userId: user.id } });
  if (!id && count >= 10) return fail("บันทึกที่อยู่ได้ไม่เกิน 10 แห่ง");
  const makeDefault = data.isDefault === true || count === 0;

  const addressId = await db.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    const fields = {
      label: data.label,
      area: data.area,
      address: data.address,
      ...(makeDefault ? { isDefault: true } : {}),
    };
    if (id) {
      const result = await tx.address.updateMany({ where: { id, userId: user.id }, data: fields });
      return result.count === 0 ? null : id;
    }
    const created = await tx.address.create({ data: { ...fields, userId: user.id } });
    return created.id;
  });
  if (!addressId) return NOT_ALLOWED;

  refreshAll();
  return ok({ addressId });
}

export async function deleteAddress(input: { addressId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ addressId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const target = await db.address.findFirst({
    where: { id: parsed.data.addressId, userId: user.id },
  });
  if (!target) return NOT_ALLOWED;

  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: target.id } });
    if (target.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });

  refreshAll();
  return ok();
}

// ---------- การแจ้งเตือน ----------

export async function markNotificationRead(input: {
  notificationId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ notificationId: idSchema }), input);
  if (!parsed.ok) return parsed;

  await db.notification.updateMany({
    where: { id: parsed.data.notificationId, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  refreshAll();
  return ok();
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  refreshAll();
  return ok();
}

// ---------- ความปลอดภัยและข้อมูลส่วนตัว ----------

/** ออกจากระบบทุกอุปกรณ์ รวมถึงเครื่องนี้ */
export async function logoutEverywhere(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  await db.session.deleteMany({ where: { userId: user.id } });
  await destroySession();
  refreshAll();
  return ok();
}

/**
 * ลบบัญชี: ลบข้อมูลส่วนตัว (ชื่อ เบอร์โทร ที่อยู่ ศาล สมุดบน การแจ้งเตือน)
 * ประวัติคำสั่งซื้อที่เสร็จแล้วถูกเก็บไว้แบบไม่ระบุตัวตนเพื่อบัญชีของร้าน
 * ลบไม่ได้ถ้ายังมีงานค้างอยู่ หรือเป็นบัญชีผู้ให้บริการ
 */
export async function deleteAccount(input: { confirmPhone: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const typed = input.confirmPhone?.replace(/[\s-]/g, "");
  if (typed !== user.phone) return fail("เบอร์โทรที่พิมพ์ยืนยันไม่ตรงกับบัญชีนี้");

  const provider = await db.provider.findUnique({ where: { userId: user.id } });
  if (provider) return fail("บัญชีผู้ให้บริการต้องติดต่อทีมงานเพื่อปิดบัญชี");

  const active = await db.order.count({
    where: { userId: user.id, status: { in: ["AWAITING_PROVIDER", "CONFIRMED", "DONE"] } },
  });
  if (active > 0) return fail("ยังมีงานที่กำลังดำเนินการ กรุณาปิดงานให้เสร็จก่อนลบบัญชี");

  await db.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { userId: user.id, status: "AWAITING_DEPOSIT" },
      data: { status: "CANCELLED" },
    });
    await tx.serviceRequest.updateMany({
      where: { userId: user.id, status: "OPEN" },
      data: { status: "CLOSED" },
    });
    await tx.address.deleteMany({ where: { userId: user.id } });
    await tx.vow.deleteMany({ where: { userId: user.id } });
    await tx.shrine.deleteMany({ where: { userId: user.id } });
    await tx.notification.deleteMany({ where: { userId: user.id } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: "ผู้ใช้ที่ลบบัญชีแล้ว",
        phone: `deleted_${user.id}`,
        role: "CUSTOMER",
        deletedAt: new Date(),
      },
    });
  });

  await destroySession();
  refreshAll();
  return ok();
}
