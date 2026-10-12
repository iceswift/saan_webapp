import { Landmark, Truck, Wrench, type LucideIcon } from "lucide-react";
import type { Tint } from "@/components/visuals";
import type { OrderStatus, OrderType } from "@/lib/constants";
import type { ServiceArtName } from "@/components/shrine-art";

/** ไอคอนและสีของงานแต่ละประเภท ใช้ได้ทั้งคำสั่งซื้อและคำขอใบเสนอราคา */
export const SERVICE_VISUALS: Record<OrderType, { icon: LucideIcon; tint: Tint }> = {
  INSTALL: { icon: Landmark, tint: "mint" },
  REMOVE: { icon: Truck, tint: "amber" },
  REPAIR: { icon: Wrench, tint: "sky" },
};

/** ภาพวาดบริการสำหรับ ThumbArt ของแต่ละประเภทงาน (ใช้กับคำสั่งซื้อและคำขอใบเสนอราคา) */
export const SERVICE_ART_NAME: Record<OrderType, ServiceArtName> = {
  INSTALL: "install",
  REMOVE: "move",
  REPAIR: "repair",
};

/** ขั้นตอนของคำสั่งซื้อจากมุมมองลูกค้า ใช้กับตัวบอกขั้นตอนในหน้ารายการและหน้ารายละเอียด */
export const ORDER_FLOW_STEPS = [
  { label: "จ่ายมัดจำ", description: "จ่ายส่วนแรกเพื่อให้ร้านรับงาน" },
  { label: "ร้านยืนยัน", description: "ร้านรับคำสั่งและนัดวันเข้างาน" },
  { label: "ร้านทำงาน", description: "ร้านเข้าทำงานตามวันนัด" },
  { label: "ตรวจรับงาน", description: "ดูงานแล้วจ่ายส่วนที่เหลือ" },
] as const;

/**
 * ลำดับขั้นปัจจุบันของคำสั่ง (เริ่มที่ 0) สำหรับ Stepper
 * ค่าเท่ากับจำนวนขั้นหมายถึงเสร็จครบทุกขั้น ส่วนคำสั่งที่ยกเลิกคืน null เพราะไม่ใช่ความคืบหน้า
 */
export function orderStepIndex(status: OrderStatus): number | null {
  switch (status) {
    case "AWAITING_DEPOSIT":
      return 0;
    case "AWAITING_PROVIDER":
      return 1;
    case "CONFIRMED":
      return 2;
    case "DONE":
      return 3;
    case "COMPLETED":
      return ORDER_FLOW_STEPS.length;
    case "CANCELLED":
      return null;
  }
}

const shortDateTimeFmt = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

/** วันที่และเวลาแบบสั้น เช่น "6 ต.ค. 69 22:51 น." ใช้ในแชตและเส้นเวลาที่พื้นที่แคบ */
export function formatShortDateTime(value: string): string {
  return `${shortDateTimeFmt.format(new Date(value)).replace(" เวลา ", " ")} น.`;
}

/** ตัดข้อความให้เหลือไม่เกินจำนวนตัวอักษรที่กำหนด โดยไม่ตัดกลางตัวอักษรไทย */
export function truncateText(text: string, max: number): string {
  const graphemes = Array.from(
    new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
  return graphemes.length > max ? `${graphemes.slice(0, max).join("")}…` : text;
}
