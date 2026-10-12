import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดหน้ายืนยันคำสั่งซื้อ: หัวเรื่อง ฟอร์มสองส่วน และแผงสรุปยอดฝั่งขวา */
export default function CheckoutLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mt-2 mb-6 h-9 w-2/3 rounded-xl lg:h-11 lg:w-96" />
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="mt-6 h-7 w-48 rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="mt-6 h-7 w-40 rounded-full" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
          <Skeleton className="hidden h-96 rounded-2xl lg:block" />
        </div>
      </div>
    </AppShell>
  );
}
