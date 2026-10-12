import { AppShell } from "@/components/app-shell";
import { HeaderSkeleton, RowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของพื้นที่ร้าน: เมนูข้าง หัวเรื่อง ชิป และแถวรายการ (รูปทรงเดียวกับแท็บงาน) */
export default function ProviderLoading() {
  return (
    <AppShell
      width="full"
      side={
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-full" />
          ))}
        </div>
      }
    >
      <div aria-busy="true" aria-label="กำลังโหลด">
        <HeaderSkeleton />
        <div className="mb-5 flex gap-2" aria-hidden="true">
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 w-24 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
