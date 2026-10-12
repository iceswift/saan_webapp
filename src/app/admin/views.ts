/** หมวดของหลังบ้านบนเดสก์ท็อป (?view=) มือถือแสดงทุกหมวดต่อกัน */
export type AdminView = "overview" | "queue" | "providers" | "orders" | "system";

export const ADMIN_VIEWS: AdminView[] = ["overview", "queue", "providers", "orders", "system"];

export function parseAdminView(raw: string | string[] | undefined): AdminView {
  return ADMIN_VIEWS.find((v) => v === raw) ?? "overview";
}
