export const BOOKING_LEAD_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

const bangkokDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });

/** Add calendar days to the Bangkok date independently of the server's local time zone. */
export function earliestBookingDate(leadDays: number, now = new Date()): string {
  const date = new Date(`${bangkokDate.format(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + leadDays);
  return date.toISOString().slice(0, 10);
}
