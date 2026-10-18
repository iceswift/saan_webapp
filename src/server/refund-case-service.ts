import "server-only";
import { z } from "zod";
import { db } from "./db";
import { isStagingTestMode } from "./runtime-policy";
import { fail, ok } from "../lib/result";

export function refundCaseTestEnabled(env: Record<string, string | undefined> = process.env) {
  return env.REFUND_CASE_TEST_MODE === "true" && env.APP_ENV !== "production" &&
    (env.APP_ENV === "staging" ? isStagingTestMode(env) : env.NODE_ENV !== "production");
}

const synthetic = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-[A-Z0-9-]{3,60}$`));
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("OPEN"), operationId: z.string().min(1).max(100), amountMinor: z.number().int().positive() }),
  z.object({ action: z.literal("DETAILS"), caseId: z.string(), version: z.number().int().nonnegative(), destination: synthetic("TEST-DEST") }),
  z.object({ action: z.literal("VERIFY"), caseId: z.string(), version: z.number().int().nonnegative() }),
  z.object({ action: z.literal("APPROVE"), caseId: z.string(), version: z.number().int().nonnegative() }),
  z.object({ action: z.literal("SEND"), caseId: z.string(), version: z.number().int().nonnegative(), reference: synthetic("TEST-TRANSFER"), evidence: synthetic("TEST-EVIDENCE") }),
  z.object({ action: z.literal("COMPLETE"), caseId: z.string(), version: z.number().int().nonnegative(), verification: synthetic("TEST-VERIFY") }),
]);
export type RefundCaseInput = z.infer<typeof inputSchema>;

/** No gateway/bank calls and no payment-ledger mutation. All case changes are audited atomically. */
export async function changeRefundCase(actorId: string, input: unknown) {
  if (!refundCaseTestEnabled()) return fail("ยังไม่เปิดขั้นตอนคืนเงินทดสอบ");
  const actor = await db.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (actor?.role !== "ADMIN") return fail("ไม่มีสิทธิ์จัดการเคสคืนเงิน");
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return fail("ใช้รหัสข้อมูลสมมติตามรูปแบบที่กำหนดเท่านั้น");
  const data = parsed.data;
  try {
    return await db.$transaction(async tx => {
      const existing = data.action === "OPEN" ? null : await tx.refundCase.findUnique({ where: { id: data.caseId } });
      const operationId = data.action === "OPEN" ? data.operationId : existing?.operationId;
      if (!operationId) return fail("ไม่พบเคสคืนเงิน");
      const operation = await tx.moneyOperation.findUnique({ where: { id: operationId }, include: { payment: true, order: true } });
      if (!operation || operation.kind !== "REFUND" || operation.status !== "ACTION_REQUIRED" ||
          operation.gateway !== "omise_test" || operation.payment?.status !== "PAID" ||
          operation.payment.gateway !== "omise_test" || !operation.payment.gatewayRef.startsWith("chrg_test_") ||
          operation.order.status !== "CANCELLED" || operation.amountMinor !== operation.payment.amount * 100) {
        return fail("รายการนี้ไม่ใช่ยอดค้างคืน Omise ทดสอบที่รองรับ");
      }
      if (data.action === "OPEN") {
        // Serialize opening against the same entitlement; never allocate a second or larger case.
        await tx.moneyOperation.update({ where: { id: operation.id }, data: { status: "ACTION_REQUIRED" } });
        if (data.amountMinor !== operation.amountMinor) return fail("รอบนี้รองรับคืนเต็มยอดเดิมเท่านั้น ห้ามคืนเกินยอด");
        if (await tx.refundCase.findUnique({ where: { operationId } })) return ok();
        const created = await tx.refundCase.create({ data: { operationId, amountMinor: data.amountMinor } });
        await tx.refundCaseEvent.create({ data: { caseId: created.id, actorId, action: "OPEN", fromStatus: "", toStatus: created.status } });
        return ok();
      }
      if (!existing || existing.version !== data.version) return fail("เคสเปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด");
      const next = {
        DETAILS: { from: ["NEEDS_DETAILS", "DETAILS_RECEIVED", "DETAILS_VERIFIED", "APPROVED"], to: "DETAILS_RECEIVED" },
        VERIFY: { from: ["DETAILS_RECEIVED"], to: "DETAILS_VERIFIED" },
        APPROVE: { from: ["DETAILS_VERIFIED"], to: "APPROVED" },
        SEND: { from: ["APPROVED"], to: "SENT_UNVERIFIED" },
        COMPLETE: { from: ["SENT_UNVERIFIED"], to: "TEST_COMPLETED" },
      }[data.action];
      if (!next.from.includes(existing.status)) return fail("สถานะเคสไม่รองรับขั้นตอนนี้");
      if (data.action === "COMPLETE" && (!existing.evidence || !existing.transferReference)) return fail("ยังไม่มีหลักฐานการส่งรายการทดสอบ");
      const change = await tx.refundCase.updateMany({ where: { id: existing.id, version: data.version, status: existing.status }, data: {
        status: next.to, version: { increment: 1 },
        ...(data.action === "DETAILS" ? { destination: data.destination } : {}),
        ...(data.action === "SEND" ? { transferReference: data.reference, evidence: data.evidence } : {}),
        ...(data.action === "COMPLETE" ? { verification: data.verification } : {}),
      } });
      if (change.count !== 1) return fail("มีผู้ดำเนินการเคสนี้แล้ว กรุณาโหลดข้อมูลล่าสุด");
      await tx.refundCaseEvent.create({ data: { caseId: existing.id, actorId, action: data.action,
        fromStatus: existing.status, toStatus: next.to,
        note: data.action === "DETAILS" ? data.destination : data.action === "SEND" ? `${data.reference} · ${data.evidence}` : data.action === "COMPLETE" ? data.verification : "",
      } });
      return ok();
    });
  } catch {
    return fail("บันทึกไม่สำเร็จ อาจมีเลขอ้างอิงซ้ำ กรุณาตรวจเคสเดิมก่อนทำต่อ");
  }
}

/** Customer projection deliberately excludes internal evidence, destination and actors. */
export async function customerRefundCases(orderId: string, userId: string) {
  return db.refundCase.findMany({ where: { operation: { orderId, order: { userId } } },
    select: { id: true, status: true, amountMinor: true, updatedAt: true }, orderBy: { createdAt: "asc" } });
}
