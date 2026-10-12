import "server-only";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { fail } from "@/lib/result";
import type { Role } from "@/lib/constants";

export const NOT_LOGGED_IN = fail("กรุณาเข้าสู่ระบบก่อน");
export const NOT_ALLOWED = fail("คุณไม่มีสิทธิ์ทำรายการนี้");

/** ตรวจข้อมูลเข้าด้วย zod คืนข้อความผิดพลาดข้อแรกเป็นภาษาไทย */
export function parseInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return fail(result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
}

/** ทุกหน้าอ่านข้อมูลสด จึงสั่งให้โหลดใหม่ทั้งแอปหลังแก้ข้อมูล */
export function refreshAll() {
  revalidatePath("/", "layout");
}

export async function newOrderCode(): Promise<string> {
  for (;;) {
    const code = `SN-${randomInt(100000, 1000000)}`;
    const taken = await db.order.findUnique({ where: { code }, select: { id: true } });
    if (!taken) return code;
  }
}

type Tx = Prisma.TransactionClient | typeof db;

export function addEvent(
  tx: Tx,
  orderId: string,
  title: string,
  byRole: Role | "SYSTEM",
  extra: { note?: string; photoUrl?: string | null } = {},
) {
  return tx.orderEvent.create({
    data: { orderId, title, byRole, note: extra.note ?? "", photoUrl: extra.photoUrl ?? null },
  });
}

export type NotificationKind = "ORDER" | "QUOTE" | "VOW" | "SYSTEM";

/** สร้างการแจ้งเตือนในแอป โดยเคารพการตั้งค่าของผู้รับ (SYSTEM ส่งเสมอ) */
export async function notify(
  tx: Tx,
  userId: string,
  kind: NotificationKind,
  title: string,
  extra: { body?: string; href?: string } = {},
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { notifyOrders: true, notifyQuotes: true, notifyVows: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return;
  if (kind === "ORDER" && !user.notifyOrders) return;
  if (kind === "QUOTE" && !user.notifyQuotes) return;
  if (kind === "VOW" && !user.notifyVows) return;
  await tx.notification.create({
    data: { userId, kind, title, body: extra.body ?? "", href: extra.href ?? "" },
  });
}

// ---------- ชิ้นส่วน schema ที่ใช้ซ้ำ ----------

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^0\d{9}$/, "กรอกเบอร์โทร 10 หลัก ขึ้นต้นด้วย 0"));

export const idSchema = z.string().min(1, "ไม่พบรายการ");

export const priceSchema = z
  .number("กรอกราคาเป็นตัวเลข")
  .int("ราคาต้องเป็นจำนวนเต็ม")
  .min(1, "ราคาต้องมากกว่า 0")
  .max(10_000_000, "ราคาสูงเกินไป");

/** พิกัดที่ลูกค้าปักหมุด (ไม่บังคับ) ต้องอยู่ในประเทศไทย */
export const geoSchema = z.object({
  lat: z.number("พิกัดไม่ถูกต้อง").min(5.5, "พิกัดอยู่นอกประเทศไทย").max(20.6, "พิกัดอยู่นอกประเทศไทย"),
  lng: z.number("พิกัดไม่ถูกต้อง").min(97.3, "พิกัดอยู่นอกประเทศไทย").max(105.7, "พิกัดอยู่นอกประเทศไทย"),
});

/** ที่อยู่ไฟล์ที่อัปโหลดผ่าน /api/upload เท่านั้น */
export const uploadUrlSchema = z
  .string()
  .regex(/^\/api\/files\/[a-f0-9]{32}\.(jpg|png|webp)$/, "ไฟล์รูปไม่ถูกต้อง");
