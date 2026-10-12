import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้าบัญชี: ชื่อกับเบอร์โทร แล้วรายการเมนูกลุ่ม */
export default function Loading() {
  return (
    <AppShell nav>
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-6 h-9 w-1/3 rounded-xl lg:mb-8 lg:h-11" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-1/2 rounded-full" />
            <Skeleton className="h-4 w-1/3 rounded-full" />
          </div>
        </div>
        <div className="surface mt-8 flex flex-col divide-y divide-border overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex min-h-14 items-center px-4">
              <Skeleton className="h-5 w-1/3 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
