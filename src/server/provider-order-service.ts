import "server-only";
import { fail, ok, type ActionResult } from "@/lib/result";
import { formatDateTime } from "@/lib/format";
import { addEvent, notify } from "./action-utils";
import { db } from "./db";

class ConfirmationError extends Error {}

/** Confirm a new appointment against the shop calendar in the same transaction.
 * Calendar closures do not alter jobs that have already been confirmed.
 */
export async function confirmProviderOrder(input: {
  orderId: string;
  userId: string;
  scheduledAt: Date;
}): Promise<ActionResult> {
  if (!Number.isFinite(input.scheduledAt.getTime()) || input.scheduledAt <= new Date()) {
    return fail("วันนัดต้องเป็นเวลาในอนาคต");
  }
  const scheduledDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(input.scheduledAt);
  try {
    await db.$transaction(async (tx) => {
      // Acquire the same order write lock used by customer cancellation.
      const locked = await tx.order.updateMany({
        where: {
          id: input.orderId,
          status: "AWAITING_PROVIDER",
          provider: { userId: input.userId, status: "VERIFIED" },
        },
        data: { status: "AWAITING_PROVIDER" },
      });
      const order = await tx.order.findUnique({ where: { id: input.orderId }, include: { provider: true } });
      if (!order || order.provider.userId !== input.userId) throw new ConfirmationError("คุณไม่มีสิทธิ์ทำรายการนี้");
      if (order.provider.status !== "VERIFIED") throw new ConfirmationError("บัญชีผู้ให้บริการยังไม่ผ่านการตรวจสอบ");
      if (locked.count !== 1) throw new ConfirmationError("คำสั่งนี้ยืนยันไม่ได้ในสถานะปัจจุบัน");
      const blocked = await tx.providerBlockedDate.findUnique({
        where: { providerId_date: { providerId: order.providerId, date: scheduledDay } },
      });
      if (blocked) throw new ConfirmationError("ร้านไม่ว่างในวันที่เลือก กรุณาเลือกวันนัดอื่น");
      const confirmed = await tx.order.updateMany({
        where: { id: order.id, providerId: order.providerId, status: "AWAITING_PROVIDER" },
        data: { status: "CONFIRMED", scheduledAt: input.scheduledAt },
      });
      if (confirmed.count !== 1) throw new ConfirmationError("คำสั่งนี้ยืนยันไม่ได้ในสถานะปัจจุบัน");
      await addEvent(tx, order.id, "ร้านยืนยันคำสั่ง", "PROVIDER", {
        note: `นัดหมาย ${formatDateTime(input.scheduledAt)}`,
      });
      await notify(tx, order.userId, "ORDER", "ร้านยืนยันคำสั่งแล้ว", {
        body: `นัดหมาย ${formatDateTime(input.scheduledAt)}`,
        href: `/orders/${order.id}`,
      });
    });
    return ok();
  } catch (error) {
    return fail(error instanceof ConfirmationError ? error.message : "คำสั่งมีการเปลี่ยนแปลง กรุณาลองใหม่");
  }
}
