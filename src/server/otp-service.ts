import "server-only";
import { db } from "./db";
import { fail, ok, type ActionResult } from "@/lib/result";

export async function consumeOtp(phone: string, code: string): Promise<ActionResult> {
  const otp = await db.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" },
  });
  if (!otp) return fail("รหัสหมดอายุ กรุณาขอรหัสใหม่");
  if (otp.attempts >= 5) return fail("ใส่รหัสผิดหลายครั้ง กรุณาขอรหัสใหม่");
  if (otp.code !== code) {
    await db.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } },
    });
    return fail("รหัสไม่ถูกต้อง");
  }
  const consumed = await db.otpCode.updateMany({
    where: { id: otp.id, consumedAt: null, attempts: { lt: 5 }, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1 ? ok() : fail("รหัสหมดอายุหรือถูกใช้แล้ว กรุณาขอรหัสใหม่");
}
