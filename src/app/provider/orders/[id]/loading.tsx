import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดหน้างานของร้าน: หัวเรื่อง บรรทัดสถานะ แล้วสองคอลัมน์ */
export default function ProviderOrderLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-2.5 mb-6 h-9 w-2/3 rounded-xl lg:h-11 lg:w-96" />
        <div className="surface p-4 lg:p-5">
          <Skeleton className="h-6 w-3/4 rounded-full" />
          <Skeleton className="mt-4 h-1 w-full rounded-full" />
        </div>
        <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
          <Skeleton className="h-60 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
