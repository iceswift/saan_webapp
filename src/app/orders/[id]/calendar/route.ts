import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { appointmentCalendar } from "@/lib/appointment-calendar";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(_request: Request, { params }: RouteContext<"/orders/[id]/calendar">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อนบันทึกวันนัด" }, { status: 401, headers });
  const { id } = await params;
  const order = await db.order.findFirst({ where: { id, userId: user.id }, include: { provider: { select: { name: true } } } });
  if (!order) return Response.json({ error: "ไม่พบงานนี้" }, { status: 404, headers });
  if (!order.scheduledAt || !["CONFIRMED", "DONE", "COMPLETED"].includes(order.status)) {
    return Response.json({ error: "งานนี้ยังไม่มีนัดที่ยืนยันแล้ว หรือถูกยกเลิก กรุณาโหลดหน้ารายละเอียดใหม่" }, { status: 409, headers });
  }
  const calendar = appointmentCalendar({ id: order.id, code: order.code, title: `นัดบริการ Saan · ${order.code}`, shop: order.provider.name, address: order.address, scheduledAt: order.scheduledAt });
  return new Response(calendar, { headers: { ...headers, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=\"saan-appointment.ics\"" } });
}
