import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้ารายละเอียดคำสั่ง: หัวเรื่อง บรรทัดสถานะเดียว แล้วรายการ */
export default function OrderDetailLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-2.5 mb-6 h-9 w-2/3 rounded-xl lg:h-11 lg:w-96" />
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
          <div>
            <div className="surface p-4 lg:p-5">
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <Skeleton className="mt-2 h-4 w-1/3 rounded-full" />
              <Skeleton className="mt-4 h-1 w-full rounded-full" />
            </div>
            <Skeleton className="mt-10 h-7 w-40 rounded-full" />
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-5 w-full rounded-full" />
              <Skeleton className="h-5 w-full rounded-full" />
              <Skeleton className="h-8 w-1/2 rounded-full" />
            </div>
          </div>
          <Skeleton className="hidden h-80 rounded-2xl lg:block" />
        </div>
      </div>
    </AppShell>
  );
}
