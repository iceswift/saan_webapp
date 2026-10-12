import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้าคำขอใบเสนอราคา: บรรทัดสถานะ แล้วการ์ดใบเสนอเทียบกัน */
export default function RequestLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <Skeleton className="mb-6 h-9 w-2/3 rounded-xl lg:h-11 lg:w-80" />
        <div className="surface p-4 lg:p-5">
          <Skeleton className="h-6 w-3/4 rounded-full" />
          <Skeleton className="mt-2 h-4 w-1/2 rounded-full" />
          <Skeleton className="mt-4 h-1 w-full rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex flex-col gap-4 surface p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-5 w-1/2 rounded-full" />
              </div>
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
