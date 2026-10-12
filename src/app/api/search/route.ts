import { NextResponse } from "next/server";
import { listProducts } from "@/server/queries";

/**
 * คำแนะนำสำหรับช่องค้นหาในส่วนหัว: GET /api/search?q=ศาล -> [{id, name, kind, price, shop}] ไม่เกิน 6 รายการ
 * ข้อมูลชุดเดียวกับรายการศาลสาธารณะ (listProducts) จึงไม่ต้องล็อกอิน คำค้นยาว 1-60 ตัวอักษร นอกนั้นตอบ []
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1 || q.length > 60) return NextResponse.json([]);
  try {
    const products = await listProducts({ q });
    return NextResponse.json(
      products.slice(0, 6).map((p) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
        price: p.price,
        shop: p.provider.name,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
