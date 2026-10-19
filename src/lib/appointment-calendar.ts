type Appointment = { id: string; code: string; title: string; shop: string; address: string; scheduledAt: Date };

function text(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}
function stamp(date: Date) {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid calendar date");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
// RFC 5545: fold at 75 UTF-8 octets, without splitting a Thai character.
function fold(line: string) {
  let result = "", width = 0;
  for (const character of line) {
    const bytes = new TextEncoder().encode(character).length;
    if (width + bytes > 75) { result += "\r\n "; width = 1; }
    result += character; width += bytes;
  }
  return result;
}
export function appointmentCalendar(appointment: Appointment, generatedAt = new Date()) {
  const uid = `${encodeURIComponent(appointment.id)}@saan.appointment`;
  const description = `เลขที่ ${appointment.code}\nร้าน ${appointment.shop}\nยังไม่ระบุเวลาสิ้นสุดงาน\nนัดนี้เป็นสำเนา ณ วันที่ดาวน์โหลด หากเลื่อนหรือยกเลิกนัด โปรดแก้ไขรายการในปฏิทินและตรวจวันนัดล่าสุดใน Saan`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saan//Appointment//TH", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stamp(generatedAt)}`, `DTSTART:${stamp(appointment.scheduledAt)}`,
    `SUMMARY:${text(appointment.title)}`, `DESCRIPTION:${text(description)}`, `LOCATION:${text(appointment.address)}`,
    "CLASS:PRIVATE", "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}
