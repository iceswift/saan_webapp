import "server-only";
import type { Prisma } from "@prisma/client";
import { lockPaymentPool } from "./payment-pool";

/** A refund entitlement, not a submitted refund. Called in the cancellation transaction.
 * PromptPay currently has no approved provider refund path; never invent a success.
 */
export async function recordRefundObligations(tx: Prisma.TransactionClient, orderId: string, actorId: string) {
  const paid = await tx.payment.findMany({ where: { orderId, status: "PAID", gateway: "omise_test", method: "PROMPTPAY" } });
  if (paid.length) await lockPaymentPool(tx);
  for (const payment of paid) {
    await tx.moneyOperation.upsert({ where: { key: `${payment.id}:REFUND` }, update: {}, create: {
      key: `${payment.id}:REFUND`, orderId, paymentId: payment.id, kind: "REFUND", method: payment.method,
      amountMinor: payment.amount * 100, gateway: payment.gateway, requestedBy: actorId,
      status: "ACTION_REQUIRED", error: "ต้องยืนยันขั้นตอนคืนเงินที่ผู้ให้บริการรองรับ ยังไม่มีการส่งคำสั่งคืนเงิน",
    } });
  }
}
