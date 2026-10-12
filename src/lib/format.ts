export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("en-US")}`;
}

const dateFmt = new Intl.DateTimeFormat("th-TH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

const shortDateFmt = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: "Asia/Bangkok",
});

const timeFmt = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

/** เช่น "วันเสาร์ที่ 24 ตุลาคม 2569" */
export function formatDate(value: Date | string): string {
  return dateFmt.format(new Date(value));
}

/** เช่น "24 ต.ค. 69" */
export function formatShortDate(value: Date | string): string {
  return shortDateFmt.format(new Date(value));
}

/** เช่น "วันเสาร์ที่ 24 ตุลาคม 2569 เวลา 09:09 น." */
export function formatDateTime(value: Date | string): string {
  const d = new Date(value);
  return `${dateFmt.format(d)} เวลา ${timeFmt.format(d)} น.`;
}

/** แปลงวันที่ YYYY-MM-DD ให้อ่านได้ โดยไม่เลื่อนวันตามเขตเวลา */
export function formatDateOnly(isoDate: string): string {
  return dateFmt.format(new Date(`${isoDate}T12:00:00+07:00`));
}

/** เช่น "081-234-5678" */
export function formatPhone(phone: string): string {
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
}
