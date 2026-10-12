"use server";

import { z } from "zod";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import {
  addEvent,
  idSchema,
  NOT_ALLOWED,
  NOT_LOGGED_IN,
  notify,
  parseInput,
  refreshAll,
} from "../action-utils";
import { fail, ok, type ActionResult } from "@/lib/result";
import { PROVIDER_STATUS } from "@/lib/constants";
import { formatBaht } from "@/lib/format";

/** อนุมัติหรือปฏิเสธผู้ให้บริการ */
export async function setProviderStatus(input: {
  providerId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role !== "ADMIN") return NOT_ALLOWED;
  const parsed = parseInput(
    z.object({ providerId: idSchema, status: z.enum(["PENDING", "VERIFIED", "REJECTED"]) }),
    input,
  );
  if (!parsed.ok) return parsed;

  const provider = await db.provider.update({
    where: { id: parsed.data.providerId },
    data: { status: parsed.data.status },
  });
  await notify(db, provider.userId, "SYSTEM", `สถานะร้านของคุณ: ${PROVIDER_STATUS[parsed.data.status]}`, {
    body:
      parsed.data.status === "VERIFIED"
        ? "เปิดรับงานและส่งใบเสนอราคาได้แล้ว"
        : parsed.data.status === "REJECTED"
          ? "กรุณาติดต่อทีมงานเพื่อสอบถามรายละเอียด"
          : "",
    href: "/provider",
  });

  refreshAll();
  return ok();
}

/**
 * บันทึกว่าคืนมัดจำของคำสั่งที่ยกเลิกแล้ว
 * ระบบยังไม่ได้โอนเงินคืนเอง ผู้ดูแลระบบต้องโอนคืนลูกค้าก่อนกดบันทึก
 */
export async function markRefunded(input: { orderId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role !== "ADMIN") return NOT_ALLOWED;
  const parsed = parseInput(z.object({ orderId: idSchema }), input);
  if (!parsed.ok) return parsed;

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payments: true },
  });
  if (!order) return NOT_ALLOWED;
  if (order.status !== "CANCELLED") return fail("คืนมัดจำได้เฉพาะคำสั่งที่ยกเลิกแล้ว");
  const paid = order.payments.filter((p) => p.status === "PAID");
  if (paid.length === 0) return fail("คำสั่งนี้ไม่มียอดที่ต้องคืน");
  const amount = paid.reduce((sum, p) => sum + p.amount, 0);

  await db.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { id: { in: paid.map((p) => p.id) } },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
    await addEvent(tx, order.id, "คืนมัดจำแล้ว", "ADMIN", { note: `คืนเงิน ${formatBaht(amount)}` });
    await notify(tx, order.userId, "ORDER", "คืนมัดจำเรียบร้อยแล้ว", {
      body: `คำสั่งเลขที่ ${order.code} คืนเงิน ${formatBaht(amount)}`,
      href: `/orders/${order.id}`,
    });
  });

  refreshAll();
  return ok();
}
