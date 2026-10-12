import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของการแจ้งเตือน: ชื่อหน้า + รายการกลุ่ม */
export default function Loading() {
  return (
    <AppShell>
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-6 h-9 w-1/2 rounded-xl lg:mb-8 lg:h-11 lg:w-72" />
        <div className="surface flex flex-col divide-y divide-border overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 px-4 py-4">
              <Skeleton className="h-5 w-3/5 rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
