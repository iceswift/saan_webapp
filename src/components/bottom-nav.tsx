"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, ClipboardList, Compass, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * v6: หน้าแรก / เลือกดู / งานของฉัน / สมุดบน / บัญชี
 * "ศาลของฉัน" (/shrines) อยู่ในเมนูบัญชี จึงนับเป็นหน้าย่อยของแท็บบัญชีบนมือถือ
 * bases = เส้นทางที่ถือว่าอยู่ในแท็บนั้น (หน้าแรกเทียบเท่ากับ / เท่านั้น)
 */
const items = [
  { href: "/", label: "หน้าแรก", icon: Home, bases: [] as string[] },
  { href: "/browse", label: "เลือกดู", icon: Compass, bases: ["/browse", "/products", "/new", "/shops"] },
  { href: "/orders", label: "งานของฉัน", icon: ClipboardList, bases: ["/orders", "/requests", "/request"] },
  { href: "/vows", label: "สมุดบน", icon: BookHeart, bases: ["/vows"] },
  { href: "/account", label: "บัญชี", icon: UserRound, bases: ["/account", "/settings", "/shrines", "/notifications"] },
];

function inSection(pathname: string, bases: string[]) {
  return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

/**
 * แถบเมนูหลักแบบแบน: พื้นขาว (ธีมมืดคือพื้นดำอุ่น) เส้นขอบบน 1px ไม่มีเงาและไม่เบลอ
 * แสดงเฉพาะมือถือและแท็บเล็ต (ซ่อนตั้งแต่ lg เพราะเดสก์ท็อปใช้ SiteHeader)
 * หน้าที่เปิดอยู่: ตัวอักษรเข้มกว่า ไอคอนหนาขึ้น และมีซุ้มโค้งสีชาดเล็ก ๆ ผุดที่ขอบล่างของแท็บ (รูปทรงซุ้มประตูศาล)
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="เมนูหลัก"
      className="sticky bottom-0 z-20 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, bases }) => {
          const active = href === "/" ? pathname === "/" : inSection(pathname, bases);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-16 flex-col items-center justify-center gap-1 text-sm leading-tight whitespace-nowrap transition-colors [.text-large_&]:text-[0.75rem]",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active ? (
                // เมื่อเปลี่ยนหน้า ขีดสีชาดเลื่อนจากแท็บเดิมมาแท็บใหม่ (shared element ของ View Transitions)
                <ViewTransition name="nav-bar-bottom" share="nav-bar" default="none">
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-t-full bg-gold"
                  />
                </ViewTransition>
              ) : null}
              <Icon
                className={cn(
                  "size-6 transition-transform duration-150 group-active:scale-90",
                  active && "animate-pop",
                )}
                strokeWidth={active ? 2 : 1.5}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
