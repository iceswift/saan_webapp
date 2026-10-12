import { cn } from "@/lib/utils";

/**
 * สองคอลัมน์สำหรับหน้าในพื้นที่ที่มีเมนูด้านข้าง (ร้านและผู้ดูแลระบบ)
 * TwoColumn แบ่งสองคอลัมน์ตั้งแต่ lg แต่เมื่อมีเมนูข้างกินที่ 15rem เนื้อหาที่ 1024px เหลือราว 656px จึงแคบเกินไป
 * ชิ้นนี้จึงเริ่มแบ่งสองคอลัมน์ที่ xl (1280px ขึ้นไป) และต่ำกว่านั้นเรียงเป็นคอลัมน์เดียวเหมือนมือถือ
 *
 * - aside: แผงด้านข้าง ติดค้างตามการเลื่อนเมื่อเป็นสองคอลัมน์ (เลื่อนในตัวเองถ้าสูงกว่าหน้าต่าง)
 * - sticky: false เมื่อแผงมีฟอร์มยาวเกินหน้าต่าง (ปล่อยให้เลื่อนไปพร้อมหน้า ดีกว่าเลื่อนซ้อนในแผง)
 * - asideFirst: true = แผงอยู่ก่อนเนื้อหาในโหมดคอลัมน์เดียว (แผงที่มีปุ่มทำงาน) และอยู่ด้านขวาตอนสองคอลัมน์
 */
export function Split({
  children,
  aside,
  asideFirst = false,
  sticky = true,
  className,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  asideFirst?: boolean;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-12",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      <aside className={cn("min-w-0 xl:self-stretch", asideFirst && "order-first xl:order-last")}>
        <div
          className={cn(
            sticky &&
              "xl:sticky xl:top-[calc(var(--site-header-h)+1.5rem)] xl:-m-1 xl:max-h-[calc(100dvh-var(--site-header-h)-2rem)] xl:overflow-y-auto xl:p-1 xl:[scrollbar-width:thin]",
          )}
        >
          {aside}
        </div>
      </aside>
    </div>
  );
}
