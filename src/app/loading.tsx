import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * โครงรอโหลด: รูปทรงเดียวกับหน้าจริง (หัวเรื่อง การ์ดเด่น รายการ) แสงวิ่งผ่านเบา ๆ
 * เดสก์ท็อป: เนื้อหาหลักกับแผงด้านข้างเหมือนหน้ารายละเอียด ไม่ใช่โครงมือถือที่ยืดกว้าง
 */
export default function Loading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <div className="flex flex-col gap-4 lg:gap-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full lg:hidden" />
            <Skeleton className="h-8 w-1/2 rounded-xl lg:h-11 lg:w-1/3" />
          </div>
          <Skeleton className="h-5 w-2/3 rounded-xl lg:w-1/4" />
        </div>
        <div className="mt-4 flex flex-col gap-8 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-14">
          <div className="flex flex-col gap-4">
            <Skeleton className="mt-3 h-36 w-full rounded-[2rem] lg:mt-0 lg:h-72" />
            <Skeleton className="h-20 w-full rounded-[1.5rem]" />
            <Skeleton className="h-20 w-full rounded-[1.5rem]" />
            <Skeleton className="h-20 w-full rounded-[1.5rem]" />
          </div>
          <Skeleton className="hidden h-96 w-full rounded-[1.5rem] lg:block" />
        </div>
      </div>
    </AppShell>
  );
}
