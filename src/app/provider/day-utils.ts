// ตัวช่วยเรื่องวันที่ตามเวลาไทย ใช้ในหน้าร้านและหน้าผู้ดูแลระบบ (ไม่มีข้อมูลหลังบ้าน คำนวณจากค่าที่หน้าได้รับ)
// ชื่อวันและเดือนเขียนเป็นตารางเองทั้งหมด เพราะ Intl ของเซิร์ฟเวอร์กับเบราว์เซอร์ให้คำย่อภาษาไทยไม่ตรงกัน (ทำให้ hydration ไม่ลงรอย)

const TZ = "Asia/Bangkok";

const WEEKDAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const WEEKDAYS_LONG = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];
const MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** เวลาปัจจุบัน แยกเป็นฟังก์ชันเพื่อให้หน้าเซิร์ฟเวอร์เรียกใช้ได้ชัดเจน */
export function currentTime(): Date {
  return new Date();
}

/** วันที่แบบ YYYY-MM-DD ตามเวลาไทย ใช้เทียบว่าเป็นวันเดียวกันหรือไม่ */
export function dayKey(value: Date | string): string {
  return keyFmt.format(new Date(value));
}

/** ส่วนประกอบของวันที่สำหรับป้ายวันที่: เลขวัน เดือนย่อ ชื่อวัน */
export function dayParts(value: Date | string) {
  const key = dayKey(value);
  const [, month, day] = key.split("-").map(Number);
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay();
  return {
    day: String(day),
    month: MONTHS_SHORT[month - 1],
    weekday: WEEKDAYS_LONG[weekday],
    weekdayShort: WEEKDAYS_SHORT[weekday],
  };
}

/** เช่น "09:30 น." */
export function timeLabel(value: Date | string): string {
  return `${timeFmt.format(new Date(value))} น.`;
}

/** เช่น "ต.ค. 69" (ปีพุทธศักราช 2 หลัก) */
export function monthLabel(value: Date | string): string {
  const [year, month] = dayKey(value).split("-").map(Number);
  return `${MONTHS_SHORT[month - 1]} ${String((year + 543) % 100).padStart(2, "0")}`;
}

/** เดือนแบบ YYYY-MM ตามเวลาไทย */
export function monthKey(value: Date | string): string {
  return dayKey(value).slice(0, 7);
}
