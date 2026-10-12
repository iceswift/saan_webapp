import { AppShell } from "@/components/app-shell";
import { TwoColumn } from "@/components/page-layout";
import { HeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้ารายละเอียดศาล: รูปเต็มขอบ ราคา รายการข้อมูล และแผงสั่งซื้อด้านขวา */
export default function ProductLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <HeaderSkeleton />
        <TwoColumn asideOn="hide" aside={<Skeleton className="h-80 w-full rounded-2xl" />}>
          <Skeleton className="-mx-5 aspect-4/3 w-[calc(100%+2.5rem)] rounded-t-[7rem] sm:-mx-8 sm:w-[calc(100%+4rem)] lg:mx-0 lg:aspect-[16/10] lg:w-full" />
          <div className="mt-6 flex flex-col gap-3 lg:hidden" aria-hidden="true">
            <Skeleton className="h-9 w-40 rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
          <div className="mt-6 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </TwoColumn>
      </div>
    </AppShell>
  );
}
