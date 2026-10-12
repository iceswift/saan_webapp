import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้าศาล: ภาพซุ้มโค้ง ข้อมูลหลัก แล้วเส้นเวลา */
export default function Loading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-6 h-9 w-2/3 rounded-xl lg:mb-8 lg:h-11 lg:w-80" />
        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_22rem] lg:gap-10">
          <Skeleton className="arch-top mx-auto aspect-[4/5] w-full max-w-72 [--arch-r:9rem] lg:mx-0" />
          <div className="mt-6 flex flex-col gap-3 lg:mt-0">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-8 hidden h-96 w-full rounded-lg lg:mt-0 lg:block" />
        </div>
        <div className="mt-10 flex flex-col gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 border-l border-border pl-6">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-5 w-3/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
