"use client";

import { Suspense, useCallback, useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Landmark,
  LogOut,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/auth";

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
type Rect = { x: number; w: number };

/**
 * เมนูแนวนอนพร้อม "แคปซูลเลื่อน": แคปซูลสีเบจใต้เมนูที่เปิดอยู่ไหลไปหาเมนูใหม่ตอนเปลี่ยนหน้า
 * และแคปซูลจาง ๆ ตามเมาส์ตอน hover (วัดตำแหน่งจริงของลิงก์ ใช้ transform จึงไม่กระทบเลย์เอาต์)
 * ก่อนวัดเสร็จ (SSR) ลิงก์ที่เปิดอยู่ใส่พื้นเบจเองไว้ก่อน จึงไม่กะพริบ ลิงก์ยังเป็น <a aria-current> ปกติ
 * ตัวอักษรน้ำหนักเท่ากันทุกเมนู ความกว้างจึงไม่เปลี่ยนตอนสลับ (ใช้ร่วมทุกชุดเมนู)
 */
function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const nav = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Rect | null>(null);
  const [last, setLast] = useState<Rect | null>(null);
  const [hover, setHover] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const activeHref = items.find((item) => item.active)?.href ?? "";

  const measure = useCallback(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const rect = el ? { x: el.offsetLeft, w: el.offsetWidth } : null;
    setActive(rect);
    if (rect) setLast(rect);
    setReady(true);
  }, []);

  // วัดใหม่ทุกครั้งที่เมนูที่เปิดอยู่เปลี่ยน
  useLayoutEffect(() => {
    measure();
  }, [measure, activeHref]);

  // และเมื่อขนาดเมนูเปลี่ยน (โหลดฟอนต์เสร็จ โหมดตัวอักษรใหญ่)
  useLayoutEffect(() => {
    const node = nav.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const shown = active ?? last;
  const lit = hover ?? shown;
  return (
    <nav
      ref={nav}
      aria-label={label}
      className="relative flex h-10 shrink-0 items-center"
      onPointerLeave={() => setHover(null)}
    >
      {shown ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-muted transition-[transform,width,opacity] duration-(--dur-base) ease-soft"
          style={{
            transform: `translateX(${shown.x}px)`,
            width: shown.w,
            opacity: active && ready ? 1 : 0,
          }}
        />
      ) : null}
      {lit ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-foreground/[0.06] transition-[transform,width,opacity] duration-(--dur-fast) ease-soft"
          style={{ transform: `translateX(${lit.x}px)`, width: lit.w, opacity: hover ? 1 : 0 }}
        />
      ) : null}
      {items.map(({ href, label: text, active: on }) => (
        <Link
          key={href}
          href={href}
          aria-current={on ? "page" : undefined}
          onPointerEnter={(e) =>
            setHover({ x: e.currentTarget.offsetLeft, w: e.currentTarget.offsetWidth })
          }
          className={cn(
            "relative z-10 flex h-10 items-center rounded-full px-3 text-base whitespace-nowrap transition-colors duration-(--dur-fast) active:scale-[0.97] max-xl:[.text-large_&]:px-2 xl:px-4",
            on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            on && !ready && "bg-muted",
          )}
        >
          {text}
        </Link>
      ))}
    </nav>
  );
}

// เมนูของพื้นที่ร้านและหลังบ้าน (ลิงก์ไป ?tab= / ?view= ของหน้าเดียวกัน) ค่าเริ่มต้นของแต่ละพื้นที่คือรายการแรก
const PROVIDER_ITEMS = [
  { value: "orders", label: "งาน" },
  { value: "calendar", label: "ปฏิทิน" },
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
 * เมนูหลักแนวนอน หน้าที่เปิดอยู่: แคปซูลเบจเลื่อนมาอยู่ใต้ชื่อเมนู
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
        "flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border text-base font-medium whitespace-nowrap transition-[color,background-color,transform] active:scale-95 max-xl:w-10 xl:px-4",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden xl:inline">{text}</span>
    </Link>
  );
}

const MENU_LINKS = [
  { href: "/account", label: "บัญชีของฉัน", icon: UserRound },
  { href: "/shrines", label: "ศาลของฉัน", icon: Landmark },
  { href: "/orders", label: "งานของฉัน", icon: ClipboardList },
  { href: "/vows", label: "สมุดบน", icon: BookOpen },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
] as const;

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-base text-foreground outline-none transition-colors data-[highlighted]:bg-muted";

/**
 * ทางเข้าบัญชี: ปุ่มอักษรย่อ (+ ชื่อบนจอกว้าง) เปิดเมนูย่อย ชื่อ/เบอร์ ลิงก์ลัด ร้าน/ผู้ดูแล (ถ้ามี) และออกจากระบบ
 * ใช้ Menu ของ Base UI (โฟกัส ลูกศร Esc คลิกนอกเมนู ได้ครบ) เมนูเปิดใต้ปุ่มชิดขอบขวา
 */
export function HeaderAccountMenu({
  name,
  phone,
  showName = true,
  isShop = false,
  isAdmin = false,
}: {
  name: string;
  phone: string;
  showName?: boolean;
  isShop?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = inSection(pathname, ["/account", "/settings"]);
  const initial = Array.from(name.trim())[0] ?? "S";

  function signOut() {
    startTransition(async () => {
      await logout();
      router.replace("/");
    });
  }

  const links: { href: string; label: string; icon: typeof Store }[] = [
    ...MENU_LINKS,
    ...(isShop ? [{ href: "/provider", label: "ร้านของฉัน", icon: Store }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "ผู้ดูแลระบบ", icon: ShieldCheck }] : []),
  ];

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={name ? `เมนูบัญชีของ ${name}` : "เมนูบัญชี"}
        className={cn(
          "flex h-10 shrink-0 items-center gap-2 rounded-full p-1 transition-[background-color,transform] outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 data-[popup-open]:bg-muted",
          showName && "xl:pr-4",
          active && "bg-muted",
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
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={14} className="z-50">
          <Menu.Popup className="w-72 origin-top-right rounded-3xl border border-border bg-popover p-2 text-popover-foreground outline-none transition-[opacity,transform] duration-(--dur-base) ease-soft data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0">
            <div className="flex items-center gap-3 px-3 pt-2 pb-3">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-normal text-primary-foreground"
              >
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{name || "บัญชีของฉัน"}</p>
                <p className="numeric truncate text-sm text-muted-foreground">{formatPhone(phone)}</p>
              </div>
            </div>
            <div className="border-t border-border pt-1.5">
              {links.map(({ href, label, icon: Icon }) => (
                <Menu.Item key={href} render={<Link href={href} />} className={itemClass}>
                  <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                  {label}
                </Menu.Item>
              ))}
            </div>
            <div className="mt-1.5 border-t border-border pt-1.5">
              <Menu.Item onClick={signOut} disabled={pending} className={itemClass}>
                <LogOut className="size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                {pending ? "กำลังออกจากระบบ" : "ออกจากระบบ"}
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
