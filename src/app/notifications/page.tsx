import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Chip, ChipRow } from "@/components/chip";
import { firstValue } from "@/app/new/options";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { EmptyState } from "@/components/visuals";
import { requireUser } from "@/server/auth";
import { countUnreadNotifications, listNotifications } from "@/server/queries";
import { bangkokDay, dayDiff } from "./days";
import { MarkAllReadButton, NotificationRow } from "./notification-items";

export const metadata: Metadata = { title: "การแจ้งเตือน" };

export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const unreadOnly = firstValue((await searchParams).filter) === "unread";
  const user = await requireUser("/notifications");
  const notifications = await listNotifications(user.id);
  const unreadCount = await countUnreadNotifications(user.id);
  const visible = unreadOnly ? await listNotifications(user.id, true) : notifications;
  const today = bangkokDay(new Date());

  return (
    <AppShell>
      <PageHeader
        eyebrow={unreadCount > 0 ? `ยังไม่ได้อ่าน ${unreadCount} รายการ` : undefined}
        title="การแจ้งเตือน"
        backHref="/account"
        backLabel="บัญชี"
        action={unreadCount > 0 ? <MarkAllReadButton /> : null}
      />

      <ChipRow label="กรองการแจ้งเตือน" className="mb-6">
        <Chip href="/notifications" active={!unreadOnly}>ล่าสุด {notifications.length}</Chip>
        <Chip href="/notifications?filter=unread" active={unreadOnly}>ยังไม่อ่าน {unreadCount}</Chip>
      </ChipRow>
      <p className="mb-4 text-sm text-muted-foreground">แสดงครั้งละไม่เกิน 50 รายการ เรียงจากใหม่ไปเก่า</p>
      {visible.length === 0 ? (
        <EmptyState
          art="bell"
          title={unreadOnly && notifications.length ? "อ่านการแจ้งเตือนครบแล้ว" : "ยังไม่มีการแจ้งเตือน"}
          description={unreadOnly && notifications.length ? "กลับไปดูประวัติการแจ้งเตือนได้ทุกเมื่อ" : "ความคืบหน้างาน ใบเสนอราคา และวันเตือนในสมุดบนจะแสดงที่นี่"}
          action={
            <LinkButton href={unreadOnly && notifications.length ? "/notifications" : "/orders"} variant="secondary" size="xl">
              {unreadOnly && notifications.length ? "ดูทั้งหมด" : "ดูงานของฉัน"}
            </LinkButton>
          }
        />
      ) : (
        <Rise>
          {[
            { label: "วันนี้", items: visible.filter(item => dayDiff(bangkokDay(item.createdAt), today) <= 0) },
            { label: "เมื่อวาน", items: visible.filter(item => dayDiff(bangkokDay(item.createdAt), today) === 1) },
            { label: "ก่อนหน้านี้", items: visible.filter(item => dayDiff(bangkokDay(item.createdAt), today) > 1) },
          ].map(group => group.items.length ? <section key={group.label} className="mb-6" aria-label={group.label}>
            <h2 className="mb-3 font-display text-xl font-medium">{group.label}</h2>
            <ListGroup label={group.label}>{group.items.map(notification => <NotificationRow
              key={notification.id} notification={notification} daysAgo={dayDiff(bangkokDay(notification.createdAt), today)} />)}</ListGroup>
          </section> : null)}
        </Rise>
      )}

      <ListGroup className="mt-8" label="ตั้งค่า">
        <ListRow href="/settings/notifications" title="ปรับการแจ้งเตือน" meta="แจ้งเฉพาะในแอป เลือกเรื่องที่อยากรับได้" />
      </ListGroup>
    </AppShell>
  );
}
