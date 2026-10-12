import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของสมุดบน: ชื่อหน้า หัวกลุ่ม แล้วรายการแบบหน้าสมุด */
export default function Loading() {
  return (
    <AppShell nav width="narrow">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-8 h-9 w-1/2 rounded-xl lg:h-11 lg:w-60" />
        <Skeleton className="h-7 w-28 rounded-full" />
        <div className="mt-3 flex flex-col divide-y divide-border border-t border-border">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-4 py-6">
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <Skeleton className="h-4 w-2/5 rounded-full" />
                <Skeleton className="h-6 w-4/5 rounded-full" />
                <Skeleton className="h-4 w-3/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
