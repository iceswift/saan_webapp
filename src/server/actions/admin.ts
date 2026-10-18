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
} from "../action-utils";
import { ok, type ActionResult } from "@/lib/result";
import { PROVIDER_STATUS } from "@/lib/constants";
import { refundOrder } from "./finance";

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

/** Legacy action uses the same authorized, idempotent refund flow. */
export async function markRefunded(input: { orderId: string }): Promise<ActionResult> {
  return refundOrder(input);
}
