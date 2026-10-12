"use client";

import { CalendarDays, ClipboardList, Inbox, Package, Store } from "lucide-react";
import { WorkspaceNav } from "./workspace-nav";

export type ProviderSection = "orders" | "calendar" | "requests" | "catalog" | "profile";

/** เมนูด้านข้างของพื้นที่ร้าน ใช้เป็น <AppShell width="full" side={<ProviderNav current="orders" />}> ในทุกหน้าของร้าน */
export function ProviderNav({
  current,
  badges,
}: {
  current: ProviderSection;
  badges?: { orders?: number; requests?: number };
}) {
  return (
    <WorkspaceNav
      title="ร้านของฉัน"
      label="เมนูร้าน"
      current={current}
      items={[
        { key: "orders", href: "/provider?tab=orders", label: "งาน", icon: ClipboardList, badge: badges?.orders },
        { key: "calendar", href: "/provider?tab=calendar", label: "ปฏิทิน", icon: CalendarDays },
        { key: "requests", href: "/provider?tab=requests", label: "คำขอ", icon: Inbox, badge: badges?.requests },
        { key: "catalog", href: "/provider?tab=catalog", label: "สินค้า", icon: Package },
        { key: "profile", href: "/provider?tab=profile", label: "ข้อมูลร้าน", icon: Store },
      ]}
    />
  );
}
