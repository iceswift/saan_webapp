"use client";

import {
  Bell,
  LayoutDashboard,
  Lock,
  MapPin,
  Settings,
  ShieldCheck,
  Type,
  UserRound,
} from "lucide-react";
import { SideNav, type SideNavGroup } from "@/components/side-nav";

// ต้องเป็น client component เพราะส่งไอคอน (ฟังก์ชัน) ให้ SideNav ข้ามจาก server ไม่ได้
const GROUPS: SideNavGroup[] = [
  {
    title: "บัญชีของฉัน",
    items: [
      { href: "/account", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
      { href: "/settings/profile", label: "โปรไฟล์", icon: UserRound },
      { href: "/settings/addresses", label: "ที่อยู่ของฉัน", icon: MapPin },
    ],
  },
  {
    title: "ตั้งค่า",
    items: [
      { href: "/settings", label: "ตั้งค่าทั้งหมด", icon: Settings, exact: true },
      { href: "/settings/notifications", label: "การแจ้งเตือน", icon: Bell },
      { href: "/settings/display", label: "การแสดงผล", icon: Type },
      { href: "/settings/security", label: "ความปลอดภัย", icon: ShieldCheck },
      { href: "/settings/privacy", label: "ความเป็นส่วนตัวและข้อมูล", icon: Lock },
    ],
  },
];

/** เมนูด้านข้างของพื้นที่บัญชีและตั้งค่า ใช้เป็น <AppShell side={<AccountNav />}> ในทุกหน้าของพื้นที่นี้ */
export function AccountNav() {
  return <SideNav groups={GROUPS} label="เมนูบัญชีและตั้งค่า" />;
}
