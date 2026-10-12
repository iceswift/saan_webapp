"use client";

import { Suspense, ViewTransition } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, ShieldCheck, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** ส่วนที่ต้องรู้ที่อยู่ปัจจุบันของ SiteHeader (client) ส่วนข้อมูลผู้ใช้อยู่ใน site-header.tsx */

function inSection(pathname: string, bases: string[]) {
  return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

const NAV_ITEMS: { href: string; label: string; bases: string[] }[] = [
  { href: "/", label: "หน้าแรก", bases: [] },
  { href: "/browse", label: "เลือกดูศาล", bases: ["/browse", "/products", "/new", "/shops"] },
  { href: "/shrines", label: "ศาลของฉัน", bases: ["/shrines"] },
  { href: "/vows", label: "สมุดบน", bases: ["/vows"] },
  { href: "/orders", label: "งานของฉัน", bases: ["/orders", "/requests", "/request"] },
];

type NavItem = { href: string; label: string; active: boolean };

/** ขีดสีชาดใต้เมนูที่เปิดอยู่ เลื่อนไปหาเมนูใหม่ตอนเปลี่ยนหน้า (ใช้ร่วมทุกชุดเมนู) */
function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <nav aria-label={label} className="flex h-full items-stretch">
      {items.map(({ href, label: text, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex items-center px-3 text-base whitespace-nowrap transition-colors xl:px-4",
            active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {text}
          {active ? (
            <ViewTransition name="nav-bar-top" share="nav-bar" default="none">
              <span
                aria-hidden="true"
                className="absolute right-3 -bottom-px left-3 h-1 rounded-t-full bg-gold xl:right-4 xl:left-4"
              />
            </ViewTransition>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

// เมนูของพื้นที่ร้านและหลังบ้าน (ลิงก์ไป ?tab= / ?view= ของหน้าเดียวกัน) ค่าเริ่มต้นของแต่ละพื้นที่คือรายการแรก
const PROVIDER_ITEMS = [
  { value: "orders", label: "งาน" },
  { value: "requests", label: "คำขอ" },
  { value: "catalog", label: "สินค้า" },
  { value: "profile", label: "ข้อมูลร้าน" },
] as const;
const ADMIN_ITEMS = [
  { value: "overview", label: "ภาพรวม" },
  { value: "queue", label: "ต้องดำเนินการ" },
  { value: "providers", label: "ผู้ให้บริการ" },
  { value: "orders", label: "คำสั่งล่าสุด" },
  { value: "system", label: "ระบบ" },
] as const;

/** เมนูของ /provider และ /admin: อ่านพารามิเตอร์จาก URL จึงต้องอยู่ใน Suspense */
function AreaNav({ area }: { area: "provider" | "admin" }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const provider = area === "provider";
  const items = provider ? PROVIDER_ITEMS : ADMIN_ITEMS;
  const key = provider ? "tab" : "view";
  const current = params.get(key) ?? items[0].value;
  const onIndex = pathname === `/${area}`;
  return (
    <NavLinks
      label={provider ? "เมนูร้าน" : "เมนูผู้ดูแลระบบ"}
      items={items.map((item, index) => ({
        href: index === 0 ? `/${area}` : `/${area}?${key}=${item.value}`,
        label: item.label,
        active: onIndex && current === item.value,
      }))}
    />
  );
}

/**
 * เมนูหลักแนวนอน หน้าที่เปิดอยู่: ตัวอักษรเข้ม และมีซุ้มโค้งสีชาดเล็ก ๆ บนเส้นล่างของส่วนหัว
 * อยู่ใต้ /provider หรือ /admin เมนูสลับเป็นเมนูของพื้นที่นั้น (ปุ่มกลับหน้าลูกค้าอยู่ที่ HeaderPill)
 */
export function HeaderNav() {
  const pathname = usePathname();
  if (inSection(pathname, ["/provider"])) {
    return (
      <Suspense fallback={<div className="w-80" aria-hidden="true" />}>
        <AreaNav area="provider" />
      </Suspense>
    );
  }
  if (inSection(pathname, ["/admin"])) {
    return (
      <Suspense fallback={<div className="w-96" aria-hidden="true" />}>
        <AreaNav area="admin" />
      </Suspense>
    );
  }
  return (
    <NavLinks
      label="เมนูหลัก"
      items={NAV_ITEMS.map(({ href, label, bases }) => ({
        href,
        label,
        active: href === "/" ? pathname === "/" : inSection(pathname, bases),
      }))}
    />
  );
}

/** ช่องค้นหาในส่วนหัว ส่งไป /browse?q= (ถ้าอยู่หน้าเลือกดูศาลจะเติมคำค้นเดิมให้) */
export function HeaderSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const onBrowse = pathname === "/browse";
  const current = onBrowse ? (params.get("q") ?? "") : "";
  // ค้นหาซ้ำในหน้าเลือกดูศาล: คงตัวกรองอื่นไว้
  const kept = onBrowse
    ? (["kind", "area", "max", "sort"] as const).flatMap((name) => {
        const value = params.get(name);
        return value ? [[name, value] as const] : [];
      })
    : [];
  return (
    <Form action="/browse" role="search" className={cn("relative min-w-0", className)}>
      {kept.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        key={current}
        name="q"
        type="search"
        aria-label="ค้นหาศาลและบริการ"
        placeholder="ค้นหาศาล"
        defaultValue={current}
        className="h-10 pr-4 pl-10"
      />
    </Form>
  );
}

// ส่งชื่อไอคอนเป็นข้อความ เพราะส่งคอมโพเนนต์ไอคอนจาก server component มา client component ไม่ได้
const PILL_ICONS = { store: Store, shield: ShieldCheck, back: ArrowLeft } as const;

/** ปุ่มทรงแคปซูลในส่วนหัว ใช้กับ "ร้านของฉัน" และ "ผู้ดูแลระบบ" ป้ายข้อความซ่อนบนจอแคบ (เหลือไอคอน) */
export function HeaderPill({
  href,
  label,
  icon,
  bases,
  backLabel,
}: {
  href: string;
  label: string;
  icon: keyof typeof PILL_ICONS;
  bases: string[];
  /** ข้อความเมื่ออยู่ในพื้นที่นั้นอยู่แล้ว: ปุ่มกลายเป็นลิงก์กลับหน้าลูกค้า (/) เช่น "กลับไปหน้าลูกค้า" */
  backLabel?: string;
}) {
  const pathname = usePathname();
  const inside = inSection(pathname, bases);
  const back = inside && Boolean(backLabel);
  const Icon = PILL_ICONS[back ? "back" : icon];
  const text = back ? (backLabel as string) : label;
  const active = inside && !back;
  return (
    <Link
      href={back ? "/" : href}
      title={text}
      aria-label={text}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border text-base font-medium whitespace-nowrap transition-colors max-xl:w-10 xl:px-4",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-foreground/20 text-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden xl:inline">{text}</span>
    </Link>
  );
}

/** ทางเข้าบัญชี: อักษรย่อในวงกลม + ชื่อ (ชื่อซ่อนบนจอแคบ) */
export function HeaderAccountLink({ name, showName = true }: { name: string; showName?: boolean }) {
  const pathname = usePathname();
  const active = inSection(pathname, ["/account", "/settings"]);
  const initial = Array.from(name.trim())[0] ?? "S";
  return (
    <Link
      href="/account"
      aria-label={name ? `บัญชีของ ${name}` : "บัญชีของฉัน"}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 rounded-full border p-1 transition-colors",
        showName && "xl:pr-4",
        active ? "border-foreground bg-muted" : "border-foreground/20 hover:bg-muted",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-primary font-display text-base font-normal text-primary-foreground"
      >
        {initial}
      </span>
      {showName ? (
        <span className="hidden max-w-28 truncate text-base font-medium xl:inline">
          {name || "บัญชีของฉัน"}
        </span>
      ) : null}
    </Link>
  );
}
