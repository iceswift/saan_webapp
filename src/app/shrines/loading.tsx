import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของรายการศาล: ชื่อหน้า + รายการกลุ่มที่มีภาพย่อ (เดสก์ท็อปเป็นการ์ดภาพ) */
export default function Loading() {
  return (
    <AppShell nav width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-6 h-9 w-1/2 rounded-xl lg:mb-8 lg:h-11 lg:w-72" />
        <div className="surface flex flex-col divide-y divide-border overflow-hidden lg:hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="size-20 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-3/5 rounded-full" />
                <Skeleton className="h-4 w-2/5 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden gap-x-6 gap-y-10 lg:grid lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="mt-3 h-5 w-3/5 rounded-full" />
              <Skeleton className="mt-2 h-4 w-2/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
