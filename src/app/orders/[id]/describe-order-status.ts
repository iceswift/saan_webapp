import type { OrderDetail } from "@/lib/types";
import { cancelledPaymentDetail } from "./cancelled-payment-detail";
import { formatWhen } from "../appointment-time";

/** ประโยคสถานะเดียวของคำสั่ง (ที่มาเดียวของข้อความสถานะในหน้านี้) */
export function describeOrderStatus(order: Pick<OrderDetail, "provider" | "status" | "scheduledAt" | "payments">): {
  title: string;
  detail?: string;
  tone: "wait" | "info" | "good" | "bad";
} {
  const shop = order.provider.name;
  switch (order.status) {
    case "AWAITING_DEPOSIT":
      return { title: "รอจ่ายมัดจำเพื่อให้ร้านรับงาน", detail: shop, tone: "wait" };
    case "AWAITING_PROVIDER":
      return { title: "รอร้านยืนยันและนัดวัน", detail: `จ่ายมัดจำแล้ว · ${shop}`, tone: "wait" };
    case "CONFIRMED":
      return {
        title: order.scheduledAt ? `ร้านนัดเข้างาน ${formatWhen(order.scheduledAt)}` : "ร้านยืนยันแล้ว",
        detail: order.scheduledAt ? shop : `${shop} จะแจ้งวันและเวลาอีกครั้ง`,
        tone: "info",
      };
    case "DONE":
      return { title: "ร้านทำงานเสร็จแล้ว รอคุณตรวจรับ", detail: shop, tone: "wait" };
    case "COMPLETED":
      return { title: "งานเสร็จสมบูรณ์", detail: `ขอบคุณที่ใช้บริการ ${shop}`, tone: "good" };
    case "CANCELLED": {
      return {
        title: "คำสั่งนี้ถูกยกเลิก",
        detail: cancelledPaymentDetail(order.payments),
        tone: "bad",
      };
    }
  }
}
