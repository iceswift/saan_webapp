"use client";

import { ClipboardList, LayoutDashboard, ListChecks, Settings2, Users } from "lucide-react";
import { WorkspaceNav } from "@/app/provider/workspace-nav";
import type { AdminView } from "./views";

/** เมนูด้านข้างของหลังบ้าน ใช้เป็น <AppShell width="full" side={<AdminNav current="overview" queueCount={n} />}> */
export function AdminNav({ current, queueCount }: { current: AdminView; queueCount?: number }) {
  return (
    <WorkspaceNav
      title="หลังบ้าน"
      label="เมนูผู้ดูแลระบบ"
      current={current}
      items={[
        { key: "overview", href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
        { key: "queue", href: "/admin?view=queue", label: "ต้องดำเนินการ", icon: ListChecks, badge: queueCount },
        { key: "providers", href: "/admin?view=providers", label: "ผู้ให้บริการ", icon: Users },
        { key: "orders", href: "/admin?view=orders", label: "คำสั่งล่าสุด", icon: ClipboardList },
        { key: "system", href: "/admin?view=system", label: "ระบบ", icon: Settings2 },
      ]}
    />
  );
}
