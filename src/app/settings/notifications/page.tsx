import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Rise } from "@/components/rise";
import { requireUser } from "@/server/auth";
import { getSettings } from "@/server/queries";
import { AccountNav } from "../account-nav";
import { NotificationSettings } from "./notification-settings";

export const metadata: Metadata = { title: "การแจ้งเตือน" };

export default async function NotificationSettingsPage() {
  const user = await requireUser("/settings/notifications");
  const settings = await getSettings(user.id);

  return (
    <AppShell side={<AccountNav />}>
      <PageHeader title="การแจ้งเตือน" backHref="/settings" />
      <Rise>
        <NotificationSettings
          initial={{
            notifyOrders: settings.notifyOrders,
            notifyQuotes: settings.notifyQuotes,
            notifyVows: settings.notifyVows,
          }}
        />
        <p className="mt-4 px-1 text-sm text-muted-foreground">
          ตอนนี้แจ้งเตือนเฉพาะในแอป ดูได้ที่ไอคอนกระดิ่ง บันทึกให้ทันทีที่แตะ
        </p>
      </Rise>
    </AppShell>
  );
}
