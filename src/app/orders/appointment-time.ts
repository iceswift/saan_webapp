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
