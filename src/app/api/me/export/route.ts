import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";

/** ดาวน์โหลดข้อมูลส่วนตัวทั้งหมดของผู้ใช้เป็นไฟล์ JSON (สิทธิ์ตาม PDPA) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const [profile, addresses, shrines, vows, orders, requests, reviews] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        largeText: true,
        notifyOrders: true,
        notifyQuotes: true,
        notifyVows: true,
      },
    }),
    db.address.findMany({
      where: { userId: user.id },
      select: { label: true, area: true, address: true, isDefault: true, createdAt: true },
    }),
    db.shrine.findMany({
      where: { userId: user.id },
      select: {
        name: true,
        kind: true,
        area: true,
        address: true,
        installedAt: true,
        createdAt: true,
        careLogs: { select: { title: true, note: true, doneAt: true } },
      },
    }),
    db.vow.findMany({
      where: { userId: user.id },
      select: { place: true, wish: true, promise: true, status: true, remindAt: true, createdAt: true },
    }),
    db.order.findMany({
      where: { userId: user.id },
      select: {
        code: true,
        type: true,
        status: true,
        area: true,
        address: true,
        note: true,
        total: true,
        deposit: true,
        scheduledAt: true,
        createdAt: true,
        items: { select: { name: true, price: true } },
        payments: { select: { kind: true, amount: true, method: true, status: true, paidAt: true } },
        messages: { where: { senderId: user.id }, select: { body: true, createdAt: true } },
      },
    }),
    db.serviceRequest.findMany({
      where: { userId: user.id },
      select: { type: true, status: true, description: true, area: true, address: true, createdAt: true },
    }),
    db.review.findMany({
      where: { userId: user.id },
      select: { rating: true, comment: true, createdAt: true },
    }),
  ]);

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), profile, addresses, shrines, vows, orders, requests, reviews },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="saan-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
