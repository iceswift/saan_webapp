/*
 * ตัวช่วยวันที่ไทย (พ.ศ.) ที่ไม่พึ่ง Intl เพื่อให้ผลเหมือนกันทั้งเซิร์ฟเวอร์และเบราว์เซอร์
 * ค่าวันที่ในระบบคือข้อความ "yyyy-mm-dd" (ปี ค.ศ.) เสมอ เหมือนที่ <input type="date"> ส่งให้ server action
 */

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/** อาทิตย์เป็นวันแรกของสัปดาห์ */
export const THAI_WEEKDAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;
export const THAI_WEEKDAYS = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
] as const;

export type YMD = { y: number; m: number; d: number };

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-23" → {y:2026,m:9,d:23} (m เริ่มที่ 0) ข้อความผิดรูปแบบหรือวันที่ไม่มีจริงคืน null */
export function parseYMD(value: string | null | undefined): YMD | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  const check = new Date(y, m, d);
  if (check.getFullYear() !== y || check.getMonth() !== m || check.getDate() !== d) return null;
  return { y, m, d };
}

export function toYMDString({ y, m, d }: YMD): string {
  return `${String(y).padStart(4, "0")}-${pad(m + 1)}-${pad(d)}`;
}

export function fromDate(date: Date): YMD {
  return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate() };
}

export function toDate({ y, m, d }: YMD): Date {
  return new Date(y, m, d);
}

export function addDays(value: YMD, days: number): YMD {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return fromDate(date);
}

export function addMonths(value: YMD, months: number): YMD {
  const date = new Date(value.y, value.m + months, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return { y: date.getFullYear(), m: date.getMonth(), d: Math.min(value.d, last) };
}

export function compareYMD(a: YMD, b: YMD): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function weekdayOf({ y, m, d }: YMD): number {
  return new Date(y, m, d).getDay();
}

/** 23 ต.ค. 2569 */
export function formatThaiShort(value: YMD): string {
  return `${value.d} ${THAI_MONTHS_SHORT[value.m]} ${value.y + 543}`;
}

/** วันศุกร์ที่ 23 ตุลาคม 2569 (ใช้เป็นชื่อสำหรับโปรแกรมอ่านหน้าจอ) */
export function formatThaiLong(value: YMD): string {
  return `${THAI_WEEKDAYS[weekdayOf(value)]}ที่ ${value.d} ${THAI_MONTHS[value.m]} ${value.y + 543}`;
}

export function todayYMD(): YMD {
  return fromDate(new Date());
}
