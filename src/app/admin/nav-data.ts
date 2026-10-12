import { getAdminStats, listPendingRefunds } from "@/server/queries";

/** จำนวนเรื่องที่รอทีมงาน (ผู้สมัครรอตรวจสอบ + มัดจำที่รอคืน) สำหรับตัวเลขบนเมนูหลังบ้านในหน้าอื่น */
export async function loadAdminQueueCount() {
  const [stats, refunds] = await Promise.all([getAdminStats(), listPendingRefunds()]);
  return stats.pendingProviders + refunds.length;
}
