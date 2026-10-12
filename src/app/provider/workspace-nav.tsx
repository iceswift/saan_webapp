"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceNavItem = {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** จำนวนรายการที่รอ แสดงเมื่อมากกว่า 0 */
  badge?: number;
};

/**
 * เมนูด้านข้างของพื้นที่ทำงาน (ร้านและผู้ดูแลระบบ) หน้าตาเหมือน SideNav แต่ระบุหน้าที่เปิดอยู่ด้วยค่า current
 * เพราะ SideNav ดูจากพาธอย่างเดียว ส่วนเมนูร้านและผู้ดูแลแยกหน้าด้วย ?tab= และ ?view= ซึ่งพาธเดียวกัน
 * ส่งให้ <AppShell side={...}> (AppShell ซ่อนบนมือถือเอง)
 */
export function WorkspaceNav({
  title,
  label,
  items,
  current,
}: {
  title: string;
  label: string;
  items: WorkspaceNavItem[];
  current: string;
}) {
  return (
    <nav aria-label={label}>
      <p className="mb-1.5 px-3.5 text-sm font-medium text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ key, href, label: text, icon: Icon, badge }) => {
          const active = key === current;
          return (
            <li key={key}>
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
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                <span className="min-w-0 flex-1">{text}</span>
                {badge !== undefined && badge > 0 ? (
                  <span
                    aria-label={`${badge} รายการรอ`}
                    className="numeric flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-sm font-medium text-primary-foreground"
                  >
                    {badge}
                  </span>
                ) : active ? (
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
