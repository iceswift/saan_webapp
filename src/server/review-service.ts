import "server-only";
import { Prisma } from "@prisma/client";
import { fail, ok, type ActionResult } from "@/lib/result";
import { db } from "./db";
import { NOT_ALLOWED, notify } from "./action-utils";

/** Internal service: the authenticated action supplies userId after validating the review fields. */
export async function createOrderReview(input: {
  orderId: string;
  userId: string;
  rating: number;
  comment?: string;
  photoUrls?: string[];
}): Promise<ActionResult> {
  try {
    return await db.$transaction(async (tx) => {
      // Serialize duplicate submissions before reading whether the review exists.
      const locked = await tx.order.updateMany({
        where: { id: input.orderId, userId: input.userId, status: "COMPLETED" },
        data: { status: "COMPLETED" },
      });
      const order = await tx.order.findUnique({
        where: { id: input.orderId }, include: { review: true, provider: true },
      });
      if (!order || order.userId !== input.userId) return NOT_ALLOWED;
      if (locked.count !== 1) return fail("รีวิวได้หลังตรวจรับงานแล้ว");
      if (order.review) return fail("คุณรีวิวคำสั่งนี้แล้ว");
      await tx.review.create({
        data: {
          orderId: order.id, userId: input.userId, providerId: order.providerId,
          rating: input.rating, comment: input.comment ?? "", photoUrls: JSON.stringify(input.photoUrls ?? []),
        },
      });
      await notify(tx, order.provider.userId, "ORDER", `คุณได้รับรีวิว ${input.rating} ดาว`, {
        body: `จากคำสั่งเลขที่ ${order.code}`, href: `/provider/orders/${order.id}`,
      });
      return ok();
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("คุณรีวิวคำสั่งนี้แล้ว");
    }
    return fail("บันทึกรีวิวไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
}
