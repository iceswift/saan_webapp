import type { OrderSummary } from "./types";

const priority: Record<string, number> = { DONE: 0, AWAITING_DEPOSIT: 1, CONFIRMED: 2, AWAITING_PROVIDER: 3 };

/** Customer decisions first, then appointments; never reorder the query's source array. */
export function homeAgenda(orders: OrderSummary[]): OrderSummary[] {
  return orders.filter(order => order.status in priority).sort((a, b) => {
    const rank = priority[a.status] - priority[b.status];
    if (rank) return rank;
    if (a.status === "CONFIRMED") {
      const appointment = (a.scheduledAt ? Date.parse(a.scheduledAt) : Infinity) -
        (b.scheduledAt ? Date.parse(b.scheduledAt) : Infinity);
      if (appointment && Number.isFinite(appointment)) return appointment;
      if (Boolean(a.scheduledAt) !== Boolean(b.scheduledAt)) return a.scheduledAt ? -1 : 1;
    }
    return Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id);
  });
}
