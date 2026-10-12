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

const whenFmt = new Intl.DateTimeFormat("th-TH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

/** "อา. 18 ต.ค. 06:41 น." ใช้กับเวลานัดเข้างาน */
export function formatWhen(iso: string): string {
  const parts = whenFmt.formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")} ${pick("hour")}:${pick("minute")} น.`;
}

/** ขั้นที่ยังไม่เกิดบนเส้นเวลา (รายการแรกคือขั้นที่กำลังรอ) */
export type TrackPending = { title: string; note?: string };

/**
 * ขั้นที่ลูกค้ากำลังรอและขั้นถัดไป ตามสถานะจริงของคำสั่ง
 * ขั้นแรกคือ "ปัจจุบัน" ซึ่งตรงกับช่องที่กำลังเติมสีบน StatusLine (orderStepIndex)
 */
export function customerPending(
  status: OrderStatus,
  info: { scheduledAt: string | null; deposit: string },
): TrackPending[] {
  const confirm: TrackPending = { title: "ร้านยืนยันรับงาน", note: "ร้านจะนัดวันเข้างาน" };
  const work: TrackPending = {
    title: "ร้านเข้าทำงาน",
    note: info.scheduledAt ? `นัด ${formatWhen(info.scheduledAt)}` : "ร้านจะแจ้งวันและเวลา",
  };
  const check: TrackPending = { title: "ตรวจรับงาน", note: "ดูงานแล้วจ่ายส่วนที่เหลือ" };
  switch (status) {
    case "AWAITING_DEPOSIT":
      return [{ title: "จ่ายมัดจำ", note: `ยอด ${info.deposit}` }, confirm, { ...work, note: undefined }, check];
    case "AWAITING_PROVIDER":
      return [confirm, { ...work, note: undefined }, check];
    case "CONFIRMED":
      return [work, check];
    case "DONE":
      return [check];
    default:
      return [];
  }
}

/** เหมือนกันแต่จากมุมมองร้าน (หน้า /provider/orders/[id]) */
export function shopPending(status: OrderStatus, scheduledAt: string | null): TrackPending[] {
  const confirm: TrackPending = { title: "ยืนยันรับงานและนัดวัน" };
  const work: TrackPending = { title: "เข้าทำงานตามนัด", note: scheduledAt ? `นัด ${formatWhen(scheduledAt)}` : undefined };
  const send: TrackPending = { title: "ส่งงาน" };
  const check: TrackPending = { title: "ลูกค้าตรวจรับและจ่ายส่วนที่เหลือ" };
  switch (status) {
    case "AWAITING_DEPOSIT":
      return [{ title: "ลูกค้าจ่ายมัดจำ" }, confirm, work, send, check];
    case "AWAITING_PROVIDER":
      return [confirm, work, send, check];
    case "CONFIRMED":
      return [work, send, check];
    case "DONE":
      return [check];
    default:
      return [];
  }
}
