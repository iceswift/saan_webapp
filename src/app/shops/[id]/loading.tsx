import { AppShell } from "@/components/app-shell";
import { HeaderSkeleton, ProductGridSkeleton } from "@/components/skeletons";
import { SharedSkeleton } from "@/components/shared-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** โครงรอโหลดของหน้าร้าน: แถบปก วงอักษรย่อ แล้วตารางศาล */
export default function ShopLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <HeaderSkeleton />
        <Skeleton className="h-28 w-full rounded-2xl sm:h-32 lg:h-44" />
        <div className="-mt-9 flex flex-col gap-3 px-4 lg:px-8" aria-hidden="true">
          <SharedSkeleton prefix="shop" share="morph-mark" className="size-20 rounded-full border-4 border-background" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="mt-10">
          <ProductGridSkeleton />
        </div>
      </div>
    </AppShell>
  );
}
