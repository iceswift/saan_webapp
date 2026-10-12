import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { ThemeToggle } from "@/components/theme-toggle";
import { Monogram } from "@/components/visuals";
import { formatPhone } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { TEXT_SIZE_COOKIE } from "@/lib/prefs";
import { AccountNav } from "./account-nav";

export const metadata: Metadata = { title: "ตั้งค่า" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const largeText = (await cookies()).get(TEXT_SIZE_COOKIE)?.value === "large";

  return (
    <AppShell side={<AccountNav />}>
      <PageHeader title="ตั้งค่า" backHref="/account" />

      <Rise>
        <ListGroup label="โปรไฟล์และธีม">
          <ListRow
            href="/settings/profile"
            thumb={<Monogram name={user.name} size="sm" />}
            title={user.name || "ยังไม่ได้ตั้งชื่อ"}
            meta={<span className="numeric">{formatPhone(user.phone)}</span>}
          />
          <ListRow title="ธีมสี" trailing={<ThemeToggle variant="icons" />} />
        </ListGroup>
      </Rise>

      <SectionTitle>บัญชี</SectionTitle>
      <ListGroup label="บัญชี">
        <ListRow href="/settings/addresses" title="ที่อยู่ของฉัน" />
        <ListRow href="/settings/notifications" title="การแจ้งเตือน" />
        <ListRow
          href="/settings/display"
          title="การแสดงผล"
          meta={largeText ? "ตัวอักษรขนาดใหญ่" : "ตัวอักษรขนาดปกติ"}
        />
      </ListGroup>

      <SectionTitle>ความปลอดภัยและข้อมูล</SectionTitle>
      <ListGroup label="ความปลอดภัยและข้อมูล">
        <ListRow href="/settings/security" title="ความปลอดภัย" />
        <ListRow href="/settings/privacy" title="ความเป็นส่วนตัวและข้อมูลของฉัน" />
      </ListGroup>

      <SectionTitle>เกี่ยวกับ</SectionTitle>
      <ListGroup label="เกี่ยวกับ">
        <ListRow href="/help" title="ช่วยเหลือ" />
        <ListRow href="/legal/terms" title="ข้อกำหนดการใช้งาน" />
        <ListRow href="/legal/privacy" title="นโยบายความเป็นส่วนตัว" />
      </ListGroup>

      <p className="mt-12 text-center text-sm text-muted-foreground">Saan เวอร์ชันทดสอบ</p>
    </AppShell>
  );
}
