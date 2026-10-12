import Link from "next/link";
import { Wordmark } from "./brand";

const GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "บริการ",
    links: [
      { label: "เลือกดูศาล", href: "/browse" },
      { label: "ตั้งศาลใหม่", href: "/new" },
      { label: "สมุดบน", href: "/vows" },
    ],
  },
  {
    title: "ความช่วยเหลือ",
    links: [
      { label: "ช่วยเหลือ", href: "/help" },
      { label: "คู่มือความรู้", href: "/guide" },
      { label: "สำหรับร้านค้า", href: "/provider" },
    ],
  },
  {
    title: "ข้อมูลทางกฎหมาย",
    links: [
      { label: "ข้อกำหนดการใช้งาน", href: "/legal/terms" },
      { label: "ความเป็นส่วนตัว", href: "/legal/privacy" },
    ],
  },
];

/**
 * ส่วนท้ายเว็บบนเดสก์ท็อป วางใน root layout ครั้งเดียว ไม่ต้องใส่ในหน้า
 * มือถือซ่อน (หน้าแรกเดิมมีลิงก์ท้ายหน้าของตัวเอง)
 */
export function SiteFooter() {
  return (
    <footer className="hidden border-t border-border bg-background lg:block">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-x-10 px-10 pt-14 pb-10">
        <div>
          <Wordmark size="md" />
          <p className="mt-3 max-w-xs text-base text-muted-foreground">
            ตลาดบริการศาลพระภูมิ ตั้ง ถอน ซ่อม และจดบันทึกสิ่งที่บนไว้ กับร้านที่ตรวจสอบแล้ว
          </p>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-medium text-muted-foreground">{group.title}</p>
            <ul className="mt-3 flex flex-col">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-base text-foreground"
                  >
                    <span className="link-draw">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-10 py-5 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Saan. สงวนลิขสิทธิ์ทั้งหมด
        </p>
      </div>
    </footer>
  );
}
