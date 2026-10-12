import type { OrderSummary } from "@/lib/types";
import { AvailabilityCalendar } from "./availability-calendar";
import { currentTime, dayKey } from "./day-utils";

/** แท็บ "ปฏิทิน": ร้านปิด/เปิดรับงานรายวัน และดูวันที่มีงานยืนยันแล้ว (นับจากงานจริงของร้าน) */
export function CalendarTab({ orders, blocked }: { orders: OrderSummary[]; blocked: string[] }) {
  const now = currentTime();
  const today = dayKey(now);
  const maxDate = dayKey(new Date(now.getTime() + 365 * 86_400_000));
  const jobs: Record<string, number> = {};
  for (const o of orders) {
    if (o.status !== "CONFIRMED" || !o.scheduledAt) continue;
    const key = dayKey(o.scheduledAt);
    jobs[key] = (jobs[key] ?? 0) + 1;
  }
  return (
    <div className="mt-5 max-w-3xl lg:mt-8">
      <AvailabilityCalendar blocked={blocked} jobs={jobs} today={today} maxDate={maxDate} />
    </div>
  );
}
