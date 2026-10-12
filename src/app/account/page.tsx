import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { ListGroup, ListRow } from "@/components/list-group";
import { NotificationBell } from "@/components/notification-bell";
import { Rise } from "@/components/rise";
import { OrderStatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Monogram } from "@/components/visuals";
import { formatBaht, formatPhone, formatShortDate } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { getMyProvider, listMyOrders, listMyShrines, listMyVows } from "@/server/queries";
import { AccountNav } from "../settings/account-nav";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = { title: "บัญชี" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [provider, shrines, orders, vows] = await Promise.all([
    getMyProvider(user.id),
    listMyShrines(user.id),
    listMyOrders(user.id),
    listMyVows(user.id),
  ]);
  const ongoing = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;

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
            meta={vows.length > 0 ? `${vows.length} รายการ` : undefined}
          />
          <ListRow href="/settings/addresses" title="ที่อยู่ของฉัน" />
        </ListGroup>
      </Rise>

      <Rise i={2}>
        <ListGroup className="mt-4" label="ทั่วไป">
          <ListRow href="/notifications" title="การแจ้งเตือน" />
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
        <section className="max-lg:hidden">
          <SectionTitle
            action={
              <Link
                href="/orders"
                className="inline-flex min-h-9 items-center text-base font-medium underline-offset-4 hover:underline"
              >
                ดูทั้งหมด
              </Link>
            }
          >
            งานล่าสุด
          </SectionTitle>
          <DataTable
            caption="งานล่าสุดของฉัน"
            rows={orders.slice(0, 5)}
            rowKey={(o) => o.id}
            rowHref={(o) => `/orders/${o.id}`}
            columns={[
              { key: "title", header: "งาน", cell: (o) => o.title, className: "max-w-0 w-full truncate" },
              { key: "status", header: "สถานะ", cell: (o) => <OrderStatusBadge status={o.status} /> },
              { key: "date", header: "วันที่สั่ง", cell: (o) => formatShortDate(o.createdAt), className: "whitespace-nowrap text-muted-foreground" },
              { key: "total", header: "ยอดรวม", align: "right", cell: (o) => formatBaht(o.total) },
            ]}
          />
        </section>
      ) : null}

      <div className="mt-8 lg:max-w-xs">
        <LogoutButton />
      </div>
    </AppShell>
  );
}
