import { ViewTransition } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Price } from "@/components/price";
import { ShrineImage } from "@/components/visuals";
import { AREAS, SHRINE_KINDS } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { ProductDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SaveButton } from "@/app/products/saved-products";

/** พื้นที่ให้บริการแบบสั้น: พื้นที่แรก และ +n เมื่อมีอีก */
function areaLabel(areas: ProductDTO["provider"]["areas"]): string | null {
  if (areas.length === 0) return null;
  return areas.length === 1 ? AREAS[areas[0]] : `${AREAS[areas[0]]} +${areas.length - 1}`;
}

/** พื้นที่ให้บริการสำหรับแผง peek: ชื่อไม่เกินสองพื้นที่ แล้ว +n */
function areaNames(areas: ProductDTO["provider"]["areas"]): string | null {
  if (areas.length === 0) return null;
  const shown = areas.slice(0, 2).map((a) => AREAS[a]).join(" · ");
  return areas.length > 2 ? `${shown} +${areas.length - 2}` : shown;
}

/**
 * การ์ดศาลตัวเดียวที่ใช้ทั้งหน้าแรก เลือกดูศาล และหน้าร้าน (v6, v6.1)
 * รูปเต็มขอบการ์ด (ไม่มีกรอบรอบรูป) แล้วมีแค่: ประเภท · ชื่อ · พื้นที่/คะแนน · ราคา
 * ทั้งการ์ดเป็นลิงก์เดียว (ไม่มีวงกลมลูกศร ไม่มีเส้นคั่น ไม่มีป้าย "ค่าศาล") ราคาเป็นสีดำ เครื่องหมาย ฿ เล็กกว่าตัวเลข
 * เครื่องหมายร้านผ่านการตรวจสอบอยู่หน้าพื้นที่ คะแนนแสดงเฉพาะเมื่อมีรีวิวจริง ปุ่มบันทึก (หัวใจ) ลอยมุมขวาบนของรูป
 * product.distanceKm (ใส่เมื่อค้นหาด้วย near) แสดงเป็น "ห่างประมาณ N กม." ในบรรทัดพื้นที่
 * ชื่อร้านอยู่ในข้อความสำหรับโปรแกรมอ่านหน้าจอเท่านั้น (หน้ารายละเอียดมีชื่อร้านเต็ม)
 *
 * v6.1: เมื่อโฮเวอร์ (เมาส์จริง) หรือโฟกัสด้วยคีย์บอร์ด การ์ดยกขึ้น 2px เส้นขอบเข้มขึ้น และแผง peek เลื่อนขึ้นทับขอบล่างของรูป
 * แสดงข้อเท็จจริงจากข้อมูลจริง: ชื่อร้าน (+ เครื่องหมายตรวจสอบ) พื้นที่ให้บริการ รัศมี คะแนน แล้ว "ดูรายละเอียด"
 * (CSS ล้วน ดู .card-peek ใน globals.css; มือถือและโหมดตัวอักษรใหญ่ไม่แสดง peek; peek ซ่อนจากโปรแกรมอ่านหน้าจอเพราะข้อมูลเดียวกันอยู่ในหน้ารายละเอียด)
 * ขนาดของการ์ดกำหนดตายตัว (ประเภท 1 บรรทัด ชื่อ 2 บรรทัด พื้นที่ 1 บรรทัด ราคา) เพื่อให้ ProductCardSkeleton มีรูปทรงเท่ากันเป๊ะ
 * prop variant / compact / showShop ยังรับได้เพื่อไม่ให้ผู้เรียกเดิมพัง แต่ไม่มีผลแล้ว (ไม่มีการ์ดใหญ่อีก)
 */
export function ProductCard({
  product,
  className,
  near,
}: {
  product: ProductDTO;
  /** @deprecated v6: ไม่มีการ์ดใหญ่แล้ว */
  variant?: "standard" | "feature";
  /** @deprecated v6: ทุกการ์ดสัดส่วนเดียวกัน */
  compact?: boolean;
  /** @deprecated v6: ชื่อร้านไม่แสดงบนการ์ดอยู่แล้ว */
  showShop?: boolean;
  className?: string;
  /** "lat,lng" ที่ปัดแล้ว ต่อท้ายลิงก์เป็น ?near= เพื่อให้หน้ารายละเอียดบอกระยะได้ */
  near?: string;
}) {
  const { provider } = product;
  const area = areaLabel(provider.areas);
  const verified = provider.status === "VERIFIED";
  const distance =
    typeof product.distanceKm === "number" ? formatDistance(product.distanceKm) : null;
  const rated = provider.rating !== null && provider.reviewCount > 0;
  const names = areaNames(provider.areas);

  return (
    <div className={cn("product-card group/card relative h-full", className)}>
      <Link
        href={near ? `/products/${product.id}?near=${near}` : `/products/${product.id}`}
        className="flex h-full flex-col overflow-hidden surface transition-[border-color] duration-200 group-hover/card:border-foreground/30"
      >
        <div className="relative overflow-hidden">
          <ViewTransition name={`product-${product.id}`} share="morph-image" default="none">
            <ShrineImage
              src={product.imageUrl}
              alt={product.name}
              kind={product.kind}
              seed={product.id}
              flush
              className="aspect-4/3 w-full sm:aspect-square"
            />
          </ViewTransition>

          {/* peek: ข้อเท็จจริงจริงของร้านและศาล (ไม่แต่งตัวเลข) ไม่แสดงบนจอสัมผัส */}
          <span
            aria-hidden="true"
            className="card-peek absolute inset-x-0 bottom-0 border-t border-border bg-card px-3.5 py-3 text-sm lg:px-4"
          >
            <span className="flex items-center gap-1.5 font-medium">
              {verified ? <ShieldCheck className="size-4 shrink-0" strokeWidth={1.8} /> : null}
              <span className="truncate">{provider.name}</span>
            </span>
            {names || provider.serviceRadiusKm ? (
              <span className="mt-0.5 block truncate text-muted-foreground">
                {names}
                {names && provider.serviceRadiusKm ? " · " : ""}
                {provider.serviceRadiusKm ? (
                  <span className="numeric">รัศมี {provider.serviceRadiusKm} กม.</span>
                ) : null}
              </span>
            ) : null}
            <span className="mt-1.5 flex items-center justify-between gap-2">
              {rated ? (
                <span className="numeric inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="size-3.5 shrink-0 fill-marigold text-marigold" />
                  {provider.rating?.toFixed(1)} ({provider.reviewCount})
                </span>
              ) : (
                <span />
              )}
              <span className="inline-flex items-center gap-1 font-medium">
                ดูรายละเอียด
                <ArrowRight className="size-4" />
              </span>
            </span>
          </span>
        </div>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3.5 lg:p-4">
          <span className="h-6 truncate text-sm leading-6 text-muted-foreground">{SHRINE_KINDS[product.kind]}</span>
          <span className="line-clamp-2 min-h-12 text-base leading-6 font-medium">{product.name}</span>
          <span className="sr-only">ร้าน {provider.name}</span>
          <span className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-6 text-muted-foreground">
            {area ? (
              <span className="inline-flex items-center gap-1">
                {verified ? (
                  <ShieldCheck
                    className="size-4 shrink-0 text-foreground"
                    strokeWidth={1.8}
                    aria-label="ร้านผ่านการตรวจสอบ"
                  />
                ) : null}
                {area}
              </span>
            ) : null}
            {distance ? <span className="numeric">ห่าง{distance}</span> : null}
            {rated ? (
              <span className="numeric inline-flex items-center gap-1">
                <Star className="size-3.5 shrink-0 fill-marigold text-marigold" aria-hidden="true" />
                {provider.rating?.toFixed(1)}
                <span className="sr-only">จาก 5 ดาว</span>
                <span aria-hidden="true">({provider.reviewCount})</span>
              </span>
            ) : null}
          </span>
          <span className="mt-auto flex h-9 items-end pb-0.5">
            <Price amount={product.price} size="md" smallSymbol />
          </span>
        </span>
      </Link>
      <SaveButton
        productId={product.id}
        productName={product.name}
        overlay
        className="absolute top-3 right-3"
      />
    </div>
  );
}
