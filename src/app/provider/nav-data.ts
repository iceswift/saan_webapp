import type { OrderSummary, ProviderRequest, ProviderSummary } from "@/lib/types";
import { listOpenRequestsForProvider, listProviderOrders } from "@/server/queries";

/** ตัวเลขบนเมนูร้าน: งานที่รอยืนยัน และคำขอที่ยังไม่ได้เสนอราคา (ร้านที่ยังไม่ผ่านตรวจสอบเสนอราคาไม่ได้ จึงเป็น 0) */
export function providerNavBadges(
  provider: ProviderSummary,
  orders: OrderSummary[],
  requests: ProviderRequest[],
) {
  return {
    orders: orders.filter((o) => o.status === "AWAITING_PROVIDER").length,
    requests: provider.status === "VERIFIED" ? requests.filter((r) => r.myQuote === null).length : 0,
  };
}

/** โหลดตัวเลขบนเมนูร้านสำหรับหน้าย่อยที่ไม่ได้ดึงรายการงานและคำขออยู่แล้ว */
export async function loadProviderNavBadges(provider: ProviderSummary) {
  const [orders, requests] = await Promise.all([
    listProviderOrders(provider.id),
    listOpenRequestsForProvider(provider),
  ]);
  return providerNavBadges(provider, orders, requests);
}
