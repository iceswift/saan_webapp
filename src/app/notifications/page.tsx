import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { EmptyState } from "@/components/visuals";
import { requireUser } from "@/server/auth";
import { listNotifications } from "@/server/queries";
import { bangkokDay, dayDiff } from "./days";
import { MarkAllReadButton, NotificationRow } from "./notification-items";

export const metadata: Metadata = { title: "การแจ้งเตือน" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await listNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const today = bangkokDay(new Date());

  return (
    <AppShell>
      <PageHeader
        eyebrow={unreadCount > 0 ? `ยังไม่ได้อ่าน ${unreadCount} รายการ` : undefined}
        title="การแจ้งเตือน"
        backHref="/"
        backLabel="หน้าแรก"
        action={unreadCount > 0 ? <MarkAllReadButton /> : null}
      />

      {notifications.length === 0 ? (
        <EmptyState
          art="bell"
          title="ยังไม่มีการแจ้งเตือน"
          description="ความคืบหน้างานและใบเสนอราคาจะแสดงที่นี่"
          action={
            <LinkButton href="/orders" variant="secondary">
              ดูงานของฉัน
            </LinkButton>
          }
        />
      ) : (
        <Rise>
          <ListGroup label="การแจ้งเตือน">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                daysAgo={dayDiff(bangkokDay(notification.createdAt), today)}
              />
            ))}
          </ListGroup>
        </Rise>
      )}

      <ListGroup className="mt-8" label="ตั้งค่า">
        <ListRow href="/settings/notifications" title="ปรับการแจ้งเตือน" meta="แจ้งเฉพาะในแอป เลือกเรื่องที่อยากรับได้" />
      </ListGroup>
    </AppShell>
  );
}
