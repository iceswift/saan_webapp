import { AppShell } from "@/components/app-shell";
import { TwoColumn } from "@/components/page-layout";
import { HeaderSkeleton, ProductGridSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้าเลือกดูศาล: ตัวกรองด้านซ้าย กริดการ์ดด้านขวา */
export default function BrowseLoading() {
  return (
    <AppShell nav width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <HeaderSkeleton />
        <TwoColumn
          side="left"
          asideSize="sm"
          asideOn="before"
          aside={
            <div className="flex flex-col gap-4 lg:gap-3" aria-hidden="true">
              <Skeleton className="h-14 w-full rounded-full lg:hidden" />
              <div className="flex gap-2 overflow-hidden lg:flex-col">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full lg:h-10 lg:w-full" />
                ))}
              </div>
            </div>
          }
        >
          <Skeleton className="mb-5 h-5 w-32 rounded-full" />
          <ProductGridSkeleton />
        </TwoColumn>
      </div>
    </AppShell>
  );
}
