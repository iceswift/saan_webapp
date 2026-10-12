import { AppShell } from "@/components/app-shell";
import { HeaderSkeleton, RowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหลังบ้าน: เมนูข้าง หัวเรื่อง ช่องตัวเลข และแถวรายการ */
export default function AdminLoading() {
  return (
    <AppShell
      width="full"
      side={
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-full" />
          ))}
        </div>
      }
    >
      <div aria-busy="true" aria-label="กำลังโหลด">
        <HeaderSkeleton />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
