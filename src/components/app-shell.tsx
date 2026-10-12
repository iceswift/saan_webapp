import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";

/** ความกว้างเนื้อหาบนเดสก์ท็อป (ตั้งแต่ lg) มือถือและแท็บเล็ตไม่เปลี่ยน */
export type PageWidth = "narrow" | "reading" | "full";

const DESKTOP_WIDTH: Record<PageWidth, string> = {
  /** ฟอร์มเดี่ยว หน้าล็อกอิน ข้อความสั้น */
  narrow: "lg:max-w-2xl",
  /** รายการ หน้ารายละเอียดคอลัมน์เดียว เอกสารอ่าน (ค่าเริ่มต้น) */
  reading: "lg:max-w-4xl",
  /** แคตตาล็อก หน้า 2 คอลัมน์ แดชบอร์ด */
  full: "lg:max-w-7xl",
};

/**
 * โครงหน้าจอของทุกหน้า
 * มือถือ/แท็บเล็ต: คอลัมน์เนื้อหากึ่งกลาง (max-w-md → 2xl) พื้นขาว เส้นขอบข้าง 1px และเมนูล่างเมื่อใส่ nav
 * เดสก์ท็อป (lg ขึ้นไป): เนื้อหาอยู่ใต้ส่วนหัวเว็บใน root layout (SiteHeader) เมนูล่างหายไป ความกว้างตาม width
 *
 * - nav: แถบเมนูล่างของลูกค้าบนมือถือ (บนเดสก์ท็อปใช้ส่วนหัวเว็บแทน จึงใส่หรือไม่ใส่ก็ได้)
 * - width: "narrow" | "reading" (ค่าเริ่มต้น) | "full" ความกว้างเนื้อหาบนเดสก์ท็อปเท่านั้น
 * - wide: ชื่อเดิม เท่ากับ width="full" (หน้าร้านและผู้ดูแลระบบ)
 * - footer: แถบปุ่มหลักที่ติดขอบล่างบนมือถือ บนเดสก์ท็อปจะไม่ติดขอบหน้าต่าง แต่ไปต่อท้ายเนื้อหา
 *   (ปลายฟอร์ม กว้างไม่เกิน 28rem ชิดซ้าย) ถ้าปุ่มหลักอยู่ในแผงด้านข้างของ TwoColumn แล้ว ให้ใส่ desktopFooter="hide"
 * - desktopFooter: "inline" (ค่าเริ่มต้น) ต่อท้ายเนื้อหา | "hide" ซ่อนบนเดสก์ท็อป
 * - side: เมนูด้านข้างสำหรับพื้นที่ที่มีหลายหน้าย่อย (ตั้งค่า ร้าน ผู้ดูแล) แสดงเฉพาะเดสก์ท็อป
 *   ใส่ <AccountNav /> หรือเมนูของพื้นที่นั้น เนื้อหาจะกลายเป็นคอลัมน์ขวาของเมนู (กว้างไม่เกิน 3xl)
 *   ใส่คู่กับ width="full" เมื่อเนื้อหาต้องกว้าง (ตาราง แดชบอร์ด) เนื้อหาจะเต็มพื้นที่ที่เหลือ
 */
export function AppShell({
  children,
  nav = false,
  wide = false,
  width,
  footer,
  desktopFooter = "inline",
  side,
}: {
  children: React.ReactNode;
  nav?: boolean;
  wide?: boolean;
  width?: PageWidth;
  footer?: React.ReactNode;
  desktopFooter?: "inline" | "hide";
  side?: React.ReactNode;
}) {
  const resolved: PageWidth = width ?? (wide ? "full" : "reading");
  // มีเมนูข้าง: ปกติกรอบ 6xl เนื้อหาไม่เกิน 3xl (ตั้งค่า/บัญชี) ถ้าใส่ width="full" ใช้ 7xl และเนื้อหาเต็มพื้นที่ที่เหลือ (ร้าน/ผู้ดูแล)
  const sideFull = Boolean(side) && resolved === "full";
  const desktop = side ? (sideFull ? "lg:max-w-7xl" : "lg:max-w-6xl") : DESKTOP_WIDTH[resolved];
  return (
    <div
      data-side={side ? "true" : undefined}
      className={cn(
        "group/shell relative mx-auto flex w-full flex-1 flex-col bg-background max-w-md md:max-w-2xl md:border-x md:border-border lg:border-x-0",
        desktop,
      )}
    >
      <main
        className={cn(
          "flex-1 px-5 pt-6 pb-8 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10 lg:pb-16",
          // ปุ่มท้ายฟอร์มบนเดสก์ท็อปต้องอยู่ถัดจากเนื้อหาเลย ไม่ลอยไปท้ายหน้าจอ
          footer && desktopFooter === "inline" && "lg:flex-none lg:pb-10",
        )}
      >
        {side ? (
          <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-12">
            <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-h)+2.5rem)] lg:block">
              {side}
            </aside>
            <div className={cn("min-w-0", !sideFull && "lg:max-w-3xl")}>{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
      {footer ? (
        <div
          className={cn(
            "sticky bottom-0 z-20 border-t border-border bg-background px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8",
            // เดสก์ท็อป: ไม่ติดขอบล่าง ต่อท้ายเนื้อหา เส้นคั่นบางนำหน้า
            "lg:static lg:mx-10 lg:mb-14 lg:border-t lg:px-0 lg:pt-6 lg:pb-0 lg:*:max-w-md",
            side && "lg:ml-[calc(2.5rem+15rem+3rem)]",
            side && !sideFull && "lg:max-w-3xl",
            desktopFooter === "hide" && "lg:hidden",
          )}
        >
          {footer}
        </div>
      ) : null}
      {nav ? <BottomNav /> : null}
    </div>
  );
}

/**
 * หัวหน้าจอ
 * มือถือ: ปุ่มย้อนกลับเป็นวงกลมข้างชื่อหน้า
 * เดสก์ท็อป: ปุ่มย้อนกลับกลายเป็นลิงก์ข้อความเล็กเหนือชื่อหน้า (เหมือนเส้นทางนำทาง) ใต้ส่วนหัวเว็บ
 * และซ่อนเองเมื่อหน้านั้นมีเมนูด้านข้าง (AppShell side)
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  /** ลิงก์ปุ่มย้อนกลับ ถ้าไม่ใส่จะไม่มีปุ่ม */
  backHref?: string;
  /** ข้อความของลิงก์ย้อนกลับบนเดสก์ท็อป เช่น "เลือกดูศาล" (ค่าเริ่มต้น "ย้อนกลับ") */
  backLabel?: string;
  action?: React.ReactNode;
  /** ป้ายเล็กสีชาดเหนือชื่อหน้า: มีได้อย่างเดียวต่อหน้า และเฉพาะเมื่อให้ข้อมูลเพิ่ม เช่น เลขที่คำสั่งซื้อ (ห้ามใช้เป็นหมวดซ้ำชื่อหน้า) */
  eyebrow?: string;
}) {
  return (
    <header className="rise mb-6 lg:mb-8">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-2 -ml-2 hidden min-h-9 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-data-[side]/shell:lg:hidden lg:inline-flex"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          {backLabel ?? "ย้อนกลับ"}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="ย้อนกลับ"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-background text-foreground transition-[transform,background-color] hover:bg-muted active:scale-95 lg:hidden"
          >
            <ChevronLeft className="size-6" />
          </Link>
        ) : null}
        <div className="min-w-[11rem] flex-1 pt-0.5">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="font-display text-[1.75rem] leading-[1.3] font-normal text-balance lg:text-[2.25rem] lg:leading-[1.25]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-base text-muted-foreground lg:mt-2 lg:text-lg">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="ml-auto shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </header>
  );
}

/**
 * หัวข้อย่อยภายในหน้า (v6)
 * - eyebrow: ยกเลิกแล้ว รับไว้เพื่อไม่ให้โค้ดเดิมพัง แต่ไม่แสดงผล (ป้ายสีชาดมีได้เฉพาะชื่อหน้า ที่ PageHeader)
 * - description: ใช้เฉพาะเมื่อให้ข้อมูลที่หัวข้อไม่บอก (เช่นเงื่อนไข) ห้ามเขียนซ้ำความหมายของหัวข้อ
 */
export function SectionTitle({
  children,
  action,
  description,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  /** ปรับระยะ เช่น className="mt-0" เมื่อเป็นหัวข้อแรกของหน้า */
  className?: string;
  /** @deprecated v6: ไม่แสดงผลแล้ว */
  eyebrow?: string;
  /** คำอธิบายสั้นใต้หัวข้อ (ใช้เท่าที่จำเป็น) */
  description?: string;
}) {
  return (
    <div className={cn("mt-[var(--section-mt)] mb-4 lg:mb-5", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-snug font-medium lg:text-2xl">{children}</h2>
        </div>
        {action}
      </div>
      {description ? <p className="mt-1 text-base text-muted-foreground">{description}</p> : null}
    </div>
  );
}
