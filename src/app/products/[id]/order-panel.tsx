import { Chip } from "@/components/chip";
import { LinkButton } from "@/components/link-button";
import { AREAS, type AreaCode } from "@/lib/constants";
import { formatBaht } from "@/lib/format";

/** คำตอบจากตัวช่วย /new ที่ส่งต่อมาทาง URL (ไม่มี = ผู้ใช้เข้ามาจากหน้าเลือกดูศาล) */
export type OrderParams = {
  area?: AreaCode;
  from?: string;
  place?: string;
  kind?: string;
  max?: string;
};

/** ลิงก์ไปหน้ายืนยันคำสั่งซื้อ: ส่งต่อคำตอบที่มี ส่วนที่ขาดจะถามต่อที่หน้านั้น (ปุ่มไม่เคยกดไม่ได้) */
export function checkoutHref(productId: string, areas: AreaCode[], p: OrderParams): string {
  const q = new URLSearchParams({ productId });
  const area = p.area ?? (areas.length === 1 ? areas[0] : undefined);
  if (area) q.set("area", area);
  if (p.place) q.set("place", p.place);
  if (p.kind) q.set("kind", p.kind);
  if (p.max) q.set("max", p.max);
  return `/new/checkout?${q.toString()}`;
}

function productHref(productId: string, p: OrderParams, area: AreaCode): string {
  const q = new URLSearchParams({ area });
  if (p.from) q.set("from", p.from);
  if (p.place) q.set("place", p.place);
  if (p.kind) q.set("kind", p.kind);
  if (p.max) q.set("max", p.max);
  return `/products/${productId}?${q.toString()}`;
}

/** บรรทัดเดียวบอกพื้นที่ติดตั้ง ("ติดตั้งที่ กรุงเทพฯ · เปลี่ยน") ไม่ถามซ้ำสิ่งที่ตัวช่วยถามไปแล้ว */
export function AreaRow({
  productId,
  areas,
  params,
}: {
  productId: string;
  areas: AreaCode[];
  params: OrderParams;
}) {
  if (areas.length === 0) {
    return <p className="text-base text-muted-foreground">ร้านนี้ยังไม่ระบุพื้นที่ให้บริการ</p>;
  }
  const area = params.area ?? (areas.length === 1 ? areas[0] : undefined);

  if (area && areas.length === 1) {
    return (
      <p className="text-base">
        <span className="text-muted-foreground">ติดตั้งที่ </span>
        <span className="font-medium">{AREAS[area]}</span>
      </p>
    );
  }

  const chips = (
    <div role="group" aria-label="พื้นที่ติดตั้ง" className="flex flex-wrap gap-2">
      {areas.map((code) => (
        <Chip key={code} href={productHref(productId, params, code)} active={code === area}>
          {AREAS[code]}
        </Chip>
      ))}
    </div>
  );

  if (!area) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-base text-muted-foreground">ติดตั้งที่</p>
        {chips}
      </div>
    );
  }

  return (
    <details className="group/area">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-muted-foreground">ติดตั้งที่ </span>
          <span className="font-medium">{AREAS[area]}</span>
        </span>
        <span className="font-medium underline underline-offset-4">เปลี่ยน</span>
      </summary>
      <div className="pt-2 pb-1">{chips}</div>
    </details>
  );
}

/** ปุ่มหลักนำด้วยราคา: ไปหน้ายืนยันคำสั่งซื้อเสมอ */
export function OrderCta({
  productId,
  areas,
  params,
  price,
  className,
}: {
  productId: string;
  areas: AreaCode[];
  params: OrderParams;
  price: number;
  className?: string;
}) {
  return (
    <LinkButton href={checkoutHref(productId, areas, params)} variant="gold" size="xl" className={className}>
      สั่งตั้งศาล · {formatBaht(price)}
    </LinkButton>
  );
}
