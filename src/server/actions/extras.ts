"use server";

import { z } from "zod";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import {
  idSchema,
  NOT_ALLOWED,
  NOT_LOGGED_IN,
  notify,
  parseInput,
  refreshAll,
  uploadUrlSchema,
} from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง");

function bangkokNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00+07:00`);
}

// ---------- ข้อความระหว่างลูกค้ากับร้าน ----------

/** ส่งข้อความในคำสั่งซื้อ ส่งได้เฉพาะลูกค้าเจ้าของ ร้านของคำสั่ง หรือผู้ดูแลระบบ */
export async function sendOrderMessage(input: {
  orderId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({
      orderId: idSchema,
      body: z.string().trim().min(1, "พิมพ์ข้อความก่อนส่ง").max(1000, "ข้อความยาวเกินไป"),
    }),
    input,
  );
  if (!parsed.ok) return parsed;
  const { orderId, body } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId }, include: { provider: true } });
  if (!order) return NOT_ALLOWED;
  const isCustomer = order.userId === user.id;
  const isProvider = order.provider.userId === user.id;
  if (!isCustomer && !isProvider && user.role !== "ADMIN") return NOT_ALLOWED;
  if (order.status === "CANCELLED") return fail("คำสั่งนี้ถูกยกเลิกแล้ว ส่งข้อความไม่ได้");

  await db.orderMessage.create({ data: { orderId, senderId: user.id, body } });

  const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body;
  if (!isCustomer) {
    await notify(db, order.userId, "ORDER", `ข้อความใหม่จาก ${isProvider ? order.provider.name : "ทีมงาน Saan"}`, {
      body: preview,
      href: `/orders/${order.id}`,
    });
  }
  if (!isProvider) {
    await notify(db, order.provider.userId, "ORDER", `ข้อความใหม่ คำสั่งเลขที่ ${order.code}`, {
      body: preview,
      href: `/provider/orders/${order.id}`,
    });
  }

  refreshAll();
  return ok();
}

// ---------- ประวัติการดูแลศาล ----------

/** บันทึกการดูแลศาลด้วยตัวเอง เช่น เปลี่ยนพวงมาลัย ทำความสะอาด */
export async function addCareLog(input: {
  shrineId: string;
  title: string;
  note?: string;
  photoUrl?: string;
  /** วันที่ทำ รูปแบบ YYYY-MM-DD */
  doneAt: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({
      shrineId: idSchema,
      title: z.string().trim().min(2, "กรอกสิ่งที่ทำ").max(120),
      note: z.string().trim().max(1000).optional(),
      photoUrl: uploadUrlSchema.optional(),
      doneAt: dateSchema,
    }),
    input,
  );
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  const shrine = await db.shrine.findFirst({ where: { id: data.shrineId, userId: user.id } });
  if (!shrine) return NOT_ALLOWED;
  const doneAt = bangkokNoon(data.doneAt);
  if (doneAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) return fail("วันที่ทำต้องไม่เป็นวันในอนาคต");

  await db.careLog.create({
    data: {
      shrineId: shrine.id,
      title: data.title,
      note: data.note ?? "",
      photoUrl: data.photoUrl ?? null,
      doneAt,
    },
  });

  refreshAll();
  return ok();
}

export async function deleteCareLog(input: { careLogId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ careLogId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const result = await db.careLog.deleteMany({
    where: { id: parsed.data.careLogId, shrine: { userId: user.id } },
  });
  if (result.count === 0) return NOT_ALLOWED;

  refreshAll();
  return ok();
}

// ---------- เตือนในสมุดบน ----------

/** ตั้งหรือยกเลิกวันเตือนของรายการในสมุดบน (remindAt เป็น YYYY-MM-DD หรือ null เพื่อยกเลิก) */
export async function setVowReminder(input: {
  vowId: string;
  remindAt: string | null;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(z.object({ vowId: idSchema, remindAt: dateSchema.nullable() }), input);
  if (!parsed.ok) return parsed;

  const result = await db.vow.updateMany({
    where: { id: parsed.data.vowId, userId: user.id },
    data: {
      remindAt: parsed.data.remindAt ? bangkokNoon(parsed.data.remindAt) : null,
      remindedAt: null,
    },
  });
  if (result.count === 0) return NOT_ALLOWED;

  refreshAll();
  return ok();
}
