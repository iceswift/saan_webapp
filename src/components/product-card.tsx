import { ViewTransition } from "react";
import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
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

/**
 * การ์ดศาลตัวเดียวที่ใช้ทั้งหน้าแรก เลือกดูศาล และหน้าร้าน (v6)
 * รูปเต็มขอบการ์ด (ไม่มีกรอบรอบรูป) แล้วมีแค่: ประเภท · ชื่อ · พื้นที่/คะแนน · ราคา
 * ทั้งการ์ดเป็นลิงก์เดียว (ไม่มีวงกลมลูกศร ไม่มีเส้นคั่น ไม่มีป้าย "ค่าศาล") ราคาเป็นสีดำ
 * เครื่องหมายร้านผ่านการตรวจสอบอยู่หน้าพื้นที่ คะแนนแสดงเฉพาะเมื่อมีรีวิวจริง ปุ่มบันทึก (หัวใจ) ลอยมุมขวาบนของรูป
 * product.distanceKm (ใส่เมื่อค้นหาด้วย near) แสดงเป็น "ห่างประมาณ N กม." ในบรรทัดพื้นที่
 * ชื่อร้านอยู่ในข้อความสำหรับโปรแกรมอ่านหน้าจอเท่านั้น (หน้ารายละเอียดมีชื่อร้านเต็ม)
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

  return (
    <div className={cn("group/card relative h-full", className)}>
      <Link
        href={near ? `/products/${product.id}?near=${near}` : `/products/${product.id}`}
        className="flex h-full flex-col overflow-hidden surface transition-colors hover:bg-muted"
      >
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

        <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3.5 lg:p-4">
          <span className="text-sm text-muted-foreground">{SHRINE_KINDS[product.kind]}</span>
          <span className="line-clamp-2 text-base leading-snug font-medium">{product.name}</span>
          <span className="sr-only">ร้าน {provider.name}</span>
          {area || rated || distance ? (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
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
          ) : null}
          <Price amount={product.price} size="md" className="mt-auto pt-2" />
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
