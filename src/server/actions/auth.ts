"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "../db";
import { createSession, destroySession, getCurrentUser } from "../auth";
import { sms } from "../integrations";
import { NOT_LOGGED_IN, parseInput, phoneSchema, refreshAll } from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";
import type { Role } from "@/lib/constants";
import { TEXT_SIZE_COOKIE } from "@/lib/prefs";
import { canUseTestLogin } from "../runtime-policy";
import { consumeOtp } from "../otp-service";

const OTP_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 5;

function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * ขอรหัส OTP ไปยังเบอร์โทร
 * เปิดเฉพาะ local development หรือ staging ที่กำหนดบัญชีทดสอบไว้เท่านั้น
 */
export async function requestOtp(input: {
  phone: string;
}): Promise<ActionResult<{ devCode: string | null }>> {
  const parsed = parseInput(z.object({ phone: phoneSchema }), input);
  if (!parsed.ok) return parsed;
  const { phone } = parsed.data;
  if (!canUseTestLogin(phone)) return fail("ขณะนี้เปิดให้เข้าสู่ระบบเฉพาะบัญชีทดสอบที่กำหนดไว้");

  const windowStart = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await db.otpCode.count({ where: { phone, createdAt: { gte: windowStart } } });
  if (recent >= MAX_REQUESTS_PER_WINDOW) {
    return fail("ขอรหัสบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpCode.create({
    data: { phone, code, expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000) },
  });
  await sms.sendOtp(phone, code);

  return ok({ devCode: code });
}

/** ยืนยัน OTP แล้วเข้าสู่ระบบ ถ้าเป็นเบอร์ใหม่จะสร้างบัญชีให้ */
export async function verifyOtp(input: {
  phone: string;
  code: string;
}): Promise<ActionResult<{ role: Role; needsName: boolean }>> {
  const parsed = parseInput(
    z.object({ phone: phoneSchema, code: z.string().regex(/^\d{6}$/, "กรอกรหัส 6 หลัก") }),
    input,
  );
  if (!parsed.ok) return parsed;
  const { phone, code } = parsed.data;
  if (!canUseTestLogin(phone)) return fail("ขณะนี้เปิดให้เข้าสู่ระบบเฉพาะบัญชีทดสอบที่กำหนดไว้");

  const consumed = await consumeOtp(phone, code);
  if (!consumed.ok) return consumed;

  let user = await db.user.upsert({ where: { phone }, create: { phone }, update: {} });
  if (adminPhones().includes(phone) && user.role !== "ADMIN") {
    user = await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }

  await createSession(user.id);
  // นำขนาดตัวอักษรที่บันทึกไว้ในบัญชีมาใช้กับเครื่องนี้
  if (user.largeText) {
    (await cookies()).set(TEXT_SIZE_COOKIE, "large", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  refreshAll();
  return ok({ role: user.role as Role, needsName: user.name === "" });
}

export async function updateProfile(input: { name: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  const parsed = parseInput(
    z.object({ name: z.string().trim().min(1, "กรอกชื่อ").max(80, "ชื่อยาวเกินไป") }),
    input,
  );
  if (!parsed.ok) return parsed;
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  refreshAll();
  return ok();
}

export async function logout(): Promise<ActionResult> {
  await destroySession();
  refreshAll();
  return ok();
}
