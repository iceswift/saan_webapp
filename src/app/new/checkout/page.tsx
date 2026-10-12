import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AREA_CODES,
  PLACE_TYPE_CODES,
  SHRINE_KIND_CODES,
} from "@/lib/constants";
import { IS_MOCK_PAYMENT } from "@/server/integrations";
import { requireUser } from "@/server/auth";
import { getProduct, listAddresses } from "@/server/queries";
import { firstValue, parseBudget, pickCode } from "../options";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "ยืนยันคำสั่งซื้อ" };

const PASSTHROUGH_KEYS = ["productId", "area", "place", "kind", "max"] as const;

/** วันพรุ่งนี้ตามเวลาประเทศไทย รูปแบบ YYYY-MM-DD */
function tomorrowInBangkok(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(date);
}

export default async function CheckoutPage({ searchParams }: PageProps<"/new/checkout">) {
  const sp = await searchParams;

  // ส่งลูกค้ากลับมาหน้านี้พร้อมค่าเดิมหลังล็อกอิน
  const query = new URLSearchParams();
  for (const key of PASSTHROUGH_KEYS) {
    const value = firstValue(sp[key]);
    if (value) query.set(key, value);
  }
  const user = await requireUser(`/new/checkout?${query.toString()}`);

  const productId = firstValue(sp.productId);
  if (!productId) notFound();
  const product = await getProduct(productId);
  if (!product) notFound();

  // ถ้ามาจากตัวช่วย /new จะมีพื้นที่และสถานที่มาแล้ว ถ้าไม่มี ถามต่อในหน้านี้ (ไม่ส่งกลับไปเริ่มใหม่)
  const areaParam = pickCode(firstValue(sp.area), AREA_CODES);
  const area = areaParam && product.provider.areas.includes(areaParam) ? areaParam : null;
  const place = pickCode(firstValue(sp.place), PLACE_TYPE_CODES) ?? null;

  const kind = pickCode(firstValue(sp.kind), SHRINE_KIND_CODES);
  const maxPrice = parseBudget(firstValue(sp.max));
  // มาจากผลลัพธ์ของตัวช่วย -> กลับไปผลลัพธ์ ไม่เช่นนั้นกลับไปหน้าศาล
  let backHref = `/products/${product.id}`;
  let backLabel = "กลับไปหน้าศาล";
  if (areaParam && place) {
    const backQuery = new URLSearchParams({ place, area: areaParam });
    if (kind) backQuery.set("kind", kind);
    if (maxPrice) backQuery.set("max", String(maxPrice));
    backHref = `/new/products?${backQuery.toString()}`;
    backLabel = "เลือกศาลใหม่";
  }

  // ที่อยู่ที่บันทึกไว้ในพื้นที่ที่ร้านนี้ให้บริการ (ที่อยู่หลักอยู่ก่อน)
  const savedAddresses = (await listAddresses(user.id)).filter((a) =>
    product.provider.areas.includes(a.area),
  );

  return (
    <CheckoutForm
      product={product}
      area={area}
      place={place}
      minDate={tomorrowInBangkok()}
      backHref={backHref}
      backLabel={backLabel}
      savedAddresses={savedAddresses}
      testMode={IS_MOCK_PAYMENT}
    />
  );
}
