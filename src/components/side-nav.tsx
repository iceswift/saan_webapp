"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SideNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** true = ถือว่าเปิดอยู่เมื่อที่อยู่ตรงกันเท่านั้น (ไม่รวมหน้าย่อย) ใช้กับหน้าภาพรวม เช่น /account */
  exact?: boolean;
  /** ตัวเลขหรือข้อความเล็กท้ายแถว เช่น จำนวนงานที่รอ */
  badge?: string | number;
};

export type SideNavGroup = { title?: string; items: SideNavItem[] };

/**
 * เมนูด้านข้างของพื้นที่ที่มีหลายหน้าย่อย (ตั้งค่า ร้าน ผู้ดูแล) ส่งให้ <AppShell side={...}>
 * แสดงเฉพาะเดสก์ท็อป (AppShell ซ่อนบนมือถือเอง) หน้าที่เปิดอยู่: พื้นเบจ ตัวอักษรหนา และจุดสีชาด
 * ต้องส่งเป็นข้อมูลล้วน (href, label, icon) เพราะเป็น client component
 */
export function SideNav({
  groups,
  label = "เมนูของพื้นที่นี้",
}: {
  groups: SideNavGroup[];
  label?: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex flex-col gap-6">
      {groups.map((group, gi) => (
        <div key={group.title ?? gi}>
          {group.title ? (
            <p className="mb-1.5 px-3.5 text-sm font-medium text-muted-foreground">{group.title}</p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, label: text, icon: Icon, exact, badge }) => {
              const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-full px-3.5 py-1.5 text-base transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {Icon ? (
                      <Icon
                        className="size-5 shrink-0"
                        strokeWidth={active ? 2 : 1.6}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">{text}</span>
                    {badge !== undefined ? (
                      <span className="numeric text-sm font-medium text-gold-ink">{badge}</span>
                    ) : active ? (
                      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
