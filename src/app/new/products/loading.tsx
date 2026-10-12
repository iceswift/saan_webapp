import { AppShell } from "@/components/app-shell";
import { HeaderSkeleton, ProductGridSkeleton } from "@/components/skeletons";

/** โครงรอโหลดของหน้าผลลัพธ์จากตัวช่วย: หัวเรื่องและตารางศาล */
export default function NewProductsLoading() {
  return (
    <AppShell width="full">
      <div aria-busy="true" aria-label="กำลังโหลด">
        <HeaderSkeleton />
        <ProductGridSkeleton />
      </div>
    </AppShell>
  );
}
