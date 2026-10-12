import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้างานของฉัน: หัวเรื่อง ชิปกรอง และกลุ่มแถวที่มีภาพย่อ */
export default function OrdersLoading() {
  return (
    <AppShell nav width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-6 h-9 w-2/3 rounded-xl lg:h-11 lg:w-80" />
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
        <div className="divide-y divide-border overflow-hidden surface">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-3/5 rounded-full" />
                <Skeleton className="h-4 w-2/5 rounded-full" />
              </div>
              <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
