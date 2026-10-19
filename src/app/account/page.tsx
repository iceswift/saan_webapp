import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { NotificationBell } from "@/components/notification-bell";
import { Rise } from "@/components/rise";
import { OrderStatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LinkButton } from "@/components/link-button";
import { EmptyState, Monogram, ThumbArt } from "@/components/visuals";
import { formatPhone, formatShortDate } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { getMyProvider, listMyOrders, listMyShrines, listMyVows, countUnreadNotifications } from "@/server/queries";
import { AccountNav } from "../settings/account-nav";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = { title: "บัญชี" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [provider, shrines, orders, vows, unread] = await Promise.all([
    getMyProvider(user.id),
    listMyShrines(user.id),
    listMyOrders(user.id),
    listMyVows(user.id),
    countUnreadNotifications(user.id),
  ]);
  const ongoing = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;

  const awaitingVows = vows.filter(vow => vow.status === "GRANTED").length;

  return (
    <AppShell nav side={<AccountNav />}>
      <PageHeader title="บัญชี" action={<NotificationBell userId={user.id} />} />

      <Rise>
        <section className="flex items-center gap-4">
          <Monogram name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-normal">{user.name || "ยังไม่ได้ตั้งชื่อ"}</p>
            <p className="numeric text-base text-muted-foreground">{formatPhone(user.phone)}</p>
          </div>
        </section>
      </Rise>

      <Rise i={1}>
        <ListGroup className="mt-8" label="ของฉัน">
          <ListRow
            href="/shrines"
            title="ศาลของฉัน"
            meta={shrines.length > 0 ? `${shrines.length} หลัง` : "ยังไม่มีศาลที่ลงทะเบียน"}
          />
          <ListRow
            href="/orders"
            title="งานของฉัน"
            meta={ongoing > 0 ? `กำลังดำเนินการ ${ongoing} งาน` : undefined}
          />
          <ListRow
            href="/vows"
            title="สมุดบน"
            meta={awaitingVows ? `รอแก้บน ${awaitingVows} รายการ` : vows.length ? `${vows.length} รายการ · เห็นได้เฉพาะคุณ` : "จดคำสัญญาและตั้งวันเตือน"}
          />
          <ListRow href="/settings/addresses" title="ที่อยู่ของฉัน" />
        </ListGroup>
      </Rise>

      <Rise i={2}>
        <ListGroup className="mt-4" label="ทั่วไป">
          <ListRow href="/notifications" title="การแจ้งเตือน" meta={unread ? `ยังไม่อ่าน ${unread} รายการ` : "ไม่มีรายการที่ยังไม่อ่าน"} />
          <ListRow title="ธีมสี" trailing={<ThemeToggle variant="icons" />} />
          <ListRow href="/settings" title="ตั้งค่า" />
          <ListRow href="/help" title="ช่วยเหลือ" />
        </ListGroup>
      </Rise>

      <Rise i={3}>
        <ListGroup className="mt-4" label="สำหรับร้านและผู้ดูแล">
          <ListRow
            href="/provider"
            title={provider ? "หน้าร้านของฉัน" : "สมัครเป็นผู้ให้บริการ"}
            meta={provider ? provider.name : "สำหรับร้านศาล พราหมณ์ และช่าง"}
          />
          {user.role === "ADMIN" ? <ListRow href="/admin" title="ผู้ดูแลระบบ" /> : null}
        </ListGroup>
      </Rise>

      {orders.length > 0 ? (
        <section className="mt-8">
          <SectionTitle
            action={
              <Link
                href="/orders"
                className="inline-flex min-h-11 items-center text-base font-medium underline-offset-4 hover:underline"
              >
                ดูทั้งหมด
              </Link>
            }
          >
            งานล่าสุด
          </SectionTitle>
          <ListGroup label="งานล่าสุดของฉัน">
            {orders.slice(0, 3).map(order => <ListRow key={order.id} href={`/orders/${order.id}`}
              thumb={<ThumbArt service={order.type === "INSTALL" ? "install" : order.type === "REMOVE" ? "move" : "repair"} size="sm" />}
              title={order.title} meta={`${order.providerName} · ${formatShortDate(order.createdAt)}`}
              trailing={<OrderStatusBadge status={order.status} />} />)}
          </ListGroup>
        </section>
      ) : <div className="mt-8"><EmptyState art="shrine" title="เริ่มดูแลเรื่องศาลกับเรา"
        description="เมื่อจองบริการแล้ว คุณจะติดตามงานและติดต่อร้านได้จากบัญชีนี้"
        action={<LinkButton href="/browse" variant="outline" size="xl">เลือกดูศาล</LinkButton>} /></div>}

      <div className="mt-8 lg:max-w-xs">
        <LogoutButton />
      </div>
    </AppShell>
  );
}
