// ตัวช่วยคำนวณวันตามเวลาไทย ใช้ร่วมกันในหน้าศาล สมุดบน และการแจ้งเตือน
// ทุกฟังก์ชันรับและคืนวันที่รูปแบบ YYYY-MM-DD (วันตามเวลา Asia/Bangkok) เพื่อไม่ให้เลื่อนวันตามเขตเวลา
import { formatThaiShort, parseYMD } from "@/components/thai-date";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });

/** วันที่ตามเวลาไทยของช่วงเวลาที่ให้มา เช่น "2026-10-08" */
export function bangkokDay(value: Date | string): string {
  return dayFmt.format(new Date(value));
}

/** จำนวนวันจาก from ถึง to (to - from) ค่าติดลบแปลว่า to มาก่อน */
export function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** "วันนี้" "เมื่อวาน" หรือ "N วันก่อน" จากจำนวนวันที่ผ่านมา */
export function daysAgoLabel(days: number): string {
  if (days <= 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  return `${days} วันก่อน`;
}

/** อายุศาลนับจากวันที่ตั้ง เช่น "2 ปี 3 เดือน" "5 เดือน" "12 วัน" คืน null ถ้าวันที่ตั้งอยู่ในอนาคต */
export function ageSince(installedDay: string, todayDay: string): string | null {
  const [y1, m1, d1] = installedDay.split("-").map(Number);
  const [y2, m2, d2] = todayDay.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  if (months < 0) return null;
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return rest > 0 ? `${years} ปี ${rest} เดือน` : `${years} ปี`;
  }
  if (months >= 1) return `${months} เดือน`;
  const days = dayDiff(installedDay, todayDay);
  return days <= 0 ? "ตั้งวันนี้" : `${days} วัน`;
}

/** วันที่แบบสั้นเป็น พ.ศ. เช่น "23 ต.ค. 2569" (วันตามเวลาไทย) ใช้ในรายการที่ไม่ต้องการวันในสัปดาห์ */
export function thaiShortDay(value: Date | string): string {
  const parsed = parseYMD(bangkokDay(value));
  return parsed ? formatThaiShort(parsed) : "";
}

/** ประโยคบอกการดูแลล่าสุดของศาล: "ดูแลล่าสุดเมื่อ 6 วันก่อน" หรือ "ยังไม่มีบันทึกการดูแล" */
export function careSentence(lastCareDay: string | null, today: string): string {
  if (!lastCareDay) return "ยังไม่มีบันทึกการดูแล";
  const days = dayDiff(lastCareDay, today);
  if (days <= 0) return "ดูแลล่าสุดวันนี้";
  if (days === 1) return "ดูแลล่าสุดเมื่อวาน";
  return `ดูแลล่าสุดเมื่อ ${days} วันก่อน`;
}
