import { cn } from "@/lib/utils";

/*
 * ชิ้นส่วนจัดหน้าสำหรับเดสก์ท็อป (lg = 1024px ขึ้นไป) มือถือและแท็บเล็ตยังเป็นคอลัมน์เดียวตามเดิม
 * ความกว้างของหน้าตั้งที่ <AppShell width="narrow | reading | full"> เมนูข้างหน้าย่อยใช้ <AppShell side>
 */

const GRID = {
  "right-md": "lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]",
  "right-sm": "lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_18rem]",
  "left-md": "lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]",
  "left-sm": "lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]",
} as const;

const ASIDE_ORDER = {
  right: { after: "", before: "order-first lg:order-last", hide: "hidden lg:block" },
  left: { after: "lg:order-first", before: "order-first", hide: "hidden lg:order-first lg:block" },
} as const;

/**
 * สองคอลัมน์: เนื้อหาหลักคู่กับแผงด้านข้างที่ติดค้างตามการเลื่อน (sticky) ใช้กับหน้ารายละเอียดสินค้า
 * หน้ายืนยันคำสั่งซื้อ และหน้าเลือกดูพร้อมตัวกรอง ใช้คู่กับ <AppShell width="full">
 *
 * - children: คอลัมน์เนื้อหาหลัก
 * - aside: แผงด้านข้าง (ปกติห่อด้วย <SidePanel>) ปุ่มหลักของหน้าควรอยู่ในแผงนี้
 * - side: "right" (ค่าเริ่มต้น แผงสรุป/สั่งซื้อ) | "left" (แผงตัวกรอง)
 * - asideSize: "md" (22-24rem แผงสั่งซื้อ/สรุป) | "sm" (14-16rem ตัวกรอง)
 * - asideOn: ลำดับบนมือถือ "after" (ต่อท้ายเนื้อหา ค่าเริ่มต้น) | "before" (ก่อนเนื้อหา เช่นตัวกรอง) |
 *   "hide" (ซ่อนบนมือถือ ใช้เมื่อมือถือมีส่วนเดียวกันอยู่ในเนื้อหาหรือในแถบล่างแล้ว)
 * - sticky: false = แผงไม่ติดค้าง
 *
 * ถ้าแผงด้านข้างมีปุ่มหลักของหน้า ให้ใส่ desktopFooter="hide" ที่ AppShell เพื่อไม่ให้มีสองปุ่ม
 */
export function TwoColumn({
  children,
  aside,
  side = "right",
  asideSize = "md",
  asideOn = "after",
  sticky = true,
  className,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  side?: "left" | "right";
  asideSize?: "sm" | "md";
  asideOn?: "after" | "before" | "hide";
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 lg:grid lg:items-start lg:gap-10 xl:gap-14",
        GRID[`${side}-${asideSize}`],
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      <aside className={cn("min-w-0 lg:self-stretch", ASIDE_ORDER[side][asideOn])}>
        <div
          className={cn(
            sticky &&
              "lg:sticky lg:top-[calc(var(--site-header-h)+1.5rem)] lg:-m-1 lg:max-h-[calc(100dvh-var(--site-header-h)-2rem)] lg:overflow-y-auto lg:[scrollbar-width:thin] lg:p-1",
          )}
        >
          {aside}
        </div>
      </aside>
    </div>
  );
}

/**
 * แผงในคอลัมน์ด้านข้างของ TwoColumn: การ์ด surface (กรอบ 1px ไม่มีเงา) มีหัวข้อได้
 * ใส่ปุ่มหลักของหน้า (variant="gold") ไว้ท้ายแผง
 */
export function SidePanel({
  title,
  children,
  className,
}: {
  title?: string;
  /** @deprecated v6: ไม่แสดงผลแล้ว */
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface p-5 lg:p-6", className)}>
      {title ? <h2 className="font-display text-xl leading-snug font-medium">{title}</h2> : null}
      <div className={cn(title ? "mt-4" : "")}>{children}</div>
    </section>
  );
}

const COLS = {
  /** การ์ดสินค้าเต็มความกว้างหน้า: 2 → 3 (sm) → 4 (lg) */
  products: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  /** การ์ดสินค้าที่มีแผงตัวกรองอยู่ข้าง: 2 → 3 (sm) → 4 (xl) เพราะคอลัมน์แคบลง */
  "products-side": "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
  /** แถวรายการแบบการ์ด (งาน สมุดบน ที่อยู่): 1 → 2 (lg) */
  list: "grid-cols-1 lg:grid-cols-2",
  /** การ์ดบริการหรือหัวข้อ: 1 → 2 (sm) → 3 (lg) */
  cards: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  /** ช่องตัวเลขสรุป (StatTile): 2 → 3 (lg) → 4 (xl) */
  tiles: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

/**
 * v6.2: หน่วงการโผล่ของ <Reveal as="li"> (ไม่ใส่ i) ตามคอลัมน์ ไม่ใช่ตามลำดับรายการ (CSS: .grid-reveal* ใน globals.css)
 * products = 2 -> 3 (sm) -> 4 (lg) | products-side = 2 -> 3 (sm) -> 4 (xl) | ถ้าแทนที่ด้วย lg:grid-cols-3 ใส่ className="grid-reveal-3"
 */
const REVEAL: Partial<Record<keyof typeof COLS, string>> = {
  products: "grid-reveal",
  "products-side": "grid-reveal grid-reveal-side",
  cards: "grid-reveal grid-reveal-cards",
};

/**
 * กริดการ์ดที่ปรับจำนวนคอลัมน์ตามจอ ห่อลูกแต่ละตัวด้วย <li>
 * cols: "products" | "products-side" | "list" | "cards" | "tiles" (ดูความหมายที่ค่าคงที่ COLS)
 */
export function CardGrid({
  cols,
  children,
  className,
}: {
  cols: keyof typeof COLS;
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={cn("grid gap-3 lg:gap-4", COLS[cols], REVEAL[cols], className)}>{children}</ul>;
}
