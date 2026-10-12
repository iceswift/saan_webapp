import { ShieldCheck, Star } from "lucide-react";
import { ListRow } from "@/components/list-group";
import { PhotoThumbs } from "@/components/lightbox";
import { Price } from "@/components/price";
import { Monogram, ThumbArt, type ServiceArtName } from "@/components/visuals";
import type { PackageType } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import type { PackageDTO, PublicReview } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * ชื่อสำหรับวงอักษรย่อ: ข้ามคำนำ "ร้าน" และสระนำหน้า (เ แ โ ใ ไ) เพื่อให้ได้พยัญชนะตัวแรกของชื่อร้านจริง
 * (ถ้าตัดแล้วไม่เหลืออะไร ใช้ชื่อเดิม)
 */
export function monogramName(name: string): string {
  const stripped = name.trim().replace(/^ร้าน\s*/, "").replace(/^[เแโใไ]+/, "");
  return stripped || name;
}

/** ดาวห้าดวง ดวงที่เต็มตามคะแนน พร้อมข้อความสำหรับโปรแกรมอ่านหน้าจอ */
export function ReviewStars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      <span className="sr-only">{rating} จาก 5 ดาว</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn("size-4", n <= filled ? "fill-marigold text-marigold" : "text-input")}
        />
      ))}
    </span>
  );
}

/** ป้าย "ตรวจสอบแล้ว" ของร้าน ใช้ได้กับร้านที่ผ่านการตรวจสอบเท่านั้น */
export function VerifiedPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-medium text-foreground",
        className,
      )}
    >
      <ShieldCheck className="size-4" aria-hidden="true" />
      ตรวจสอบแล้ว
    </span>
  );
}

/** รีวิวหนึ่งรายการ แสดงชื่อลูกค้าแบบย่อ */
export function ReviewItem({ review }: { review: PublicReview }) {
  const label = review.customerName.replace(/^คุณ/, "");
  return (
    <li className="flex gap-4 py-5">
      <Monogram name={monogramName(label)} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-base font-medium">{review.customerName}</p>
          <span className="text-sm text-muted-foreground">{formatShortDate(review.createdAt)}</span>
        </div>
        <div className="mt-1">
          <ReviewStars rating={review.rating} />
        </div>
        {review.comment ? (
          <p className="mt-2 text-base leading-relaxed whitespace-pre-line">{review.comment}</p>
        ) : null}
        <PhotoThumbs urls={review.photoUrls} alt="รูปงานจริงจากลูกค้า" className="mt-3" />
      </div>
    </li>
  );
}

/**
 * สรุปคะแนนรีวิว: คะแนนเฉลี่ยและแถบสัดส่วนแต่ละดาว คำนวณจากรีวิวจริงที่ส่งเข้ามาเท่านั้น
 * total คือจำนวนรีวิวทั้งหมดของร้าน ถ้ามากกว่ารีวิวที่แสดง จะบอกว่าคิดจากรีวิวล่าสุด
 */
export function RatingBreakdown({
  reviews,
  average,
  total,
}: {
  reviews: PublicReview[];
  average: number | null;
  total: number;
}) {
  if (reviews.length === 0 || average === null) return null;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  return (
    <div className="flex items-center gap-6">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <p className="numeric font-display text-4xl font-normal">{average.toFixed(1)}</p>
        <ReviewStars rating={average} />
        <p className="numeric text-sm text-muted-foreground">{total} รีวิว</p>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5" aria-label="สัดส่วนคะแนนรีวิว">
        {counts.map(({ star, count }) => (
          <li key={star} className="flex items-center gap-2 text-sm">
            <span className="numeric w-3 text-right text-muted-foreground">{star}</span>
            <Star className="size-3.5 shrink-0 fill-marigold text-marigold" aria-hidden="true" />
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-marigold"
                style={{ width: `${(count / reviews.length) * 100}%` }}
              />
            </span>
            <span className="numeric w-5 text-right text-muted-foreground">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PACKAGE_ART: Record<PackageType, ServiceArtName> = {
  CEREMONY: "ceremony",
  OFFERINGS: "offering",
  BASE: "install",
  REMOVE_OLD: "move",
};

/** บริการเสริมแบบข้อมูลอย่างเดียว ไม่มีปุ่มสั่ง วางใน <ListGroup> */
export function PackageRow({ pkg }: { pkg: PackageDTO }) {
  return (
    <ListRow
      thumb={<ThumbArt service={PACKAGE_ART[pkg.type]} size="sm" />}
      title={pkg.name}
      meta={pkg.description ? <span className="line-clamp-2">{pkg.description}</span> : undefined}
      trailing={<Price amount={pkg.price} size="sm" className="shrink-0" />}
    />
  );
}
