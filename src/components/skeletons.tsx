import { Skeleton } from "@/components/ui/skeleton";
import { CardGrid } from "@/components/page-layout";
import { cn } from "@/lib/utils";

/*
 * โครงรอโหลดที่มีรูปทรงเดียวกับหน้าจริง (หัวเรื่อง การ์ดศาล แถวรายการ) กะพริบความทึบเบา ๆ
 * ใช้ใน loading.tsx ของแต่ละเส้นทางและใน Suspense ภายในหน้า
 */

/** หัวหน้าจอ: ป้ายเล็ก + ชื่อหน้า */
export function HeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mb-6 lg:mb-8", className)} aria-hidden="true">
      <Skeleton className="h-4 w-28 rounded-full" />
      <Skeleton className="mt-2.5 h-9 w-2/3 rounded-xl lg:h-11 lg:w-80" />
    </div>
  );
}

/**
 * การ์ดศาลหนึ่งใบ: รูปทรงเท่ากับ ProductCard เป๊ะ (รูป aspect เดียวกัน ขอบ 1px ช่องไฟเท่ากัน
 * ประเภท h-6, ชื่อ min-h-12 (2 บรรทัด), พื้นที่ min-h-6, ราคา h-9) ตอนข้อมูลมาจึงไม่มีอะไรขยับ
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden surface", className)} aria-hidden="true">
      <Skeleton className="aspect-4/3 w-full rounded-none sm:aspect-square" />
      <div className="flex flex-1 flex-col gap-0.5 p-3.5 lg:p-4">
        <div className="flex h-6 items-center">
          <Skeleton className="h-4 w-1/3 rounded-full" />
        </div>
        <div className="flex min-h-12 flex-col justify-center gap-2">
          <Skeleton className="h-4 w-4/5 rounded-full" />
          <Skeleton className="h-4 w-3/5 rounded-full" />
        </div>
        <div className="flex min-h-6 items-center">
          <Skeleton className="h-4 w-2/5 rounded-full" />
        </div>
        <div className="mt-auto flex h-9 items-end pb-0.5">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <CardGrid cols="products-side" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </CardGrid>
  );
}

/** แถวรายการ (ไอคอน + สองบรรทัด) ใช้กับงาน คำขอ สมุดบน */
export function RowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 surface p-4", className)} aria-hidden="true">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-3/5 rounded-full" />
        <Skeleton className="h-4 w-2/5 rounded-full" />
      </div>
      <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <CardGrid cols="list">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <RowSkeleton />
        </li>
      ))}
    </CardGrid>
  );
}

/** หน้าแรก: แผงเด่น + แถวบริการ + กริดศาล */
export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลด">
      <Skeleton className="h-80 w-full rounded-3xl lg:h-[26rem]" />
      <div className="mt-12 lg:mt-20 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <div>
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="mt-2.5 h-8 w-48 rounded-xl" />
        </div>
        <div className="mt-5 flex flex-col gap-4 lg:mt-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 border-t border-border pt-4">
              <Skeleton className="h-5 w-6 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-6 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-4/5 rounded-full" />
              </div>
              <Skeleton className="size-20 rounded-lg lg:size-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-3 lg:mt-24 lg:grid-cols-3 lg:gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ProductCardSkeleton key={i} className={i > 3 ? "max-lg:hidden" : undefined} />
        ))}
      </div>
    </div>
  );
}
