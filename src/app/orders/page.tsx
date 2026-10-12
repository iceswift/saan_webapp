import type { Metadata } from "next";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { Chip, ChipRow } from "@/components/chip";
import { DataTable, type DataColumn } from "@/components/data-table";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { NotificationBell } from "@/components/notification-bell";
import { TwoColumn } from "@/components/page-layout";
import { Price } from "@/components/price";
import { Rise } from "@/components/rise";
import { OrderStatusBadge, RequestStatusBadge } from "@/components/status-badge";
import { ThumbArt } from "@/components/thumb-art";
import { EmptyState } from "@/components/visuals";
import { REQUEST_TYPES } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";
import { requireUser } from "@/server/auth";
import { listMyOrders, listMyRequests } from "@/server/queries";
import { firstValue, pickCode } from "@/app/new/options";
import { SERVICE_ART_NAME, truncateText } from "./display";

export const metadata: Metadata = { title: "งานของฉัน" };

const SHOW_CODES = ["active", "done"] as const;

function isActive(order: OrderSummary): boolean {
  return order.status !== "COMPLETED" && order.status !== "CANCELLED";
}

/** บรรทัดรองเดียวของคำสั่ง: วันนัดหรือวันที่สร้าง (สั้นพอไม่ตัดบรรทัดบนมือถือ) */
function metaText(order: OrderSummary): string {
  return order.scheduledAt
    ? `นัด ${formatShortDate(order.scheduledAt)}`
    : `สร้าง ${formatShortDate(order.createdAt)}`;
}

/** คอลัมน์ของตารางคำสั่งซื้อบนเดสก์ท็อป (มือถือใช้ ListGroup) */
const ORDER_COLUMNS: DataColumn<OrderSummary>[] = [
  {
    key: "order",
    header: "คำสั่งซื้อ",
    cell: (order) => (
      <span className="flex items-center gap-3">
        <ThumbArt service={SERVICE_ART_NAME[order.type]} size="sm" />
        <span className="min-w-0">
          <span className="line-clamp-2 block text-base leading-snug font-medium">{order.title}</span>
          <span className="numeric block text-sm font-normal text-muted-foreground">{order.code} · {metaText(order)}</span>
        </span>
      </span>
    ),
  },
  {
    key: "status",
    header: "สถานะ",
    className: "w-48",
    cell: (order) => <OrderStatusBadge status={order.status} />,
  },
  {
    key: "total",
    header: "ยอดรวม",
    align: "right",
    className: "w-32",
    cell: (order) => <Price amount={order.total} size="sm" />,
  },
];

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const user = await requireUser("/orders");
  const sp = await searchParams;
  const show = pickCode(firstValue(sp.show), SHOW_CODES);

  const [orders, requests] = await Promise.all([
    listMyOrders(user.id),
    listMyRequests(user.id),
  ]);

  if (orders.length === 0 && requests.length === 0) {
    return (
      <AppShell nav>
        <PageHeader title="งานของฉัน" action={<NotificationBell userId={user.id} />} />
        <EmptyState
          art="garland"
          title="ยังไม่มีงานของคุณ"
          description="เริ่มตั้งศาลใหม่ หรือขอใบเสนอราคาสำหรับงานซ่อมและถอนศาล"
          action={<LinkButton href="/new">ตั้งศาลใหม่</LinkButton>}
        />
      </AppShell>
    );
  }

  const activeCount = orders.filter(isActive).length;
  const doneCount = orders.length - activeCount;
  const visible =
    show === "active" ? orders.filter(isActive) : show === "done" ? orders.filter((o) => !isActive(o)) : orders;

  return (
    <AppShell nav width="full">
      <PageHeader title="งานของฉัน" action={<NotificationBell userId={user.id} />} />

      <TwoColumn
        className="gap-0 lg:mt-2"
        aside={
          <section aria-label="คำขอใบเสนอราคา" className="mt-10 lg:mt-0">
            <SectionTitle
              className="lg:mt-0"
              action={
                <LinkButton href="/request/new?type=REPAIR" variant="outline">
                  ขอใหม่
                </LinkButton>
              }
            >
              ขอใบเสนอราคา
            </SectionTitle>
            {requests.length === 0 ? (
              <p className="text-base text-muted-foreground">ยังไม่มีคำขอ ขอราคาจากหลายร้านเพื่อเปรียบเทียบก่อนตัดสินใจ</p>
            ) : (
              <ListGroup label="คำขอใบเสนอราคา">
                {requests.map((request) => {
                  const ready = request.status === "OPEN" && request.quoteCount > 0;
                  return (
                    <ListRow
                      key={request.id}
                      href={`/requests/${request.id}`}
                      thumb={<ThumbArt service={request.type === "REMOVE" ? "move" : "repair"} size="sm" />}
                      title={REQUEST_TYPES[request.type]}
                      meta={
                        ready ? (
                          <span className="font-medium text-foreground">
                            มี <span className="numeric">{request.quoteCount}</span> ใบเสนอราคา รอคุณเลือก
                          </span>
                        ) : (
                          truncateText(request.description, 40)
                        )
                      }
                      trailing={<RequestStatusBadge status={request.status} />}
                    />
                  );
                })}
              </ListGroup>
            )}
          </section>
        }
      >
        <Rise>
          <ChipRow label="กรองคำสั่งซื้อ" className="mb-4 lg:mb-5">
            <Chip href="/orders" active={show === undefined}>
              ทั้งหมด <span className="numeric">{orders.length}</span>
            </Chip>
            <Chip href="/orders?show=active" active={show === "active"}>
              กำลังดำเนินการ <span className="numeric">{activeCount}</span>
            </Chip>
            <Chip href="/orders?show=done" active={show === "done"}>
              เสร็จสิ้น <span className="numeric">{doneCount}</span>
            </Chip>
          </ChipRow>
        </Rise>

        {visible.length === 0 ? (
          <EmptyState
            art="garland"
            title={orders.length === 0 ? "ยังไม่มีคำสั่งซื้อ" : "ไม่มีรายการในหมวดนี้"}
            action={
              orders.length === 0 ? (
                <LinkButton href="/new">ตั้งศาลใหม่</LinkButton>
              ) : (
                <LinkButton href="/orders" variant="outline">
                  ดูทั้งหมด
                </LinkButton>
              )
            }
          />
        ) : (
          <>
            <div className="xl:hidden">
              <ListGroup label="คำสั่งซื้อ">
                {visible.map((order) => (
                  <ListRow
                    key={order.id}
                    href={`/orders/${order.id}`}
                    thumb={<ThumbArt service={SERVICE_ART_NAME[order.type]} size="sm" />}
                    title={<span className="line-clamp-2">{order.title}</span>}
                    meta={<span className="numeric">{metaText(order)}</span>}
                    trailing={<OrderStatusBadge status={order.status} />}
                  />
                ))}
              </ListGroup>
            </div>
            <DataTable
              from="xl"
              caption="คำสั่งซื้อของฉัน"
              columns={ORDER_COLUMNS}
              rows={visible}
              rowKey={(order) => order.id}
              rowHref={(order) => `/orders/${order.id}`}
            />
          </>
        )}
      </TwoColumn>
    </AppShell>
  );
}
