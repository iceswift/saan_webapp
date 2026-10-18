import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Clock, Inbox, Undo2 } from "lucide-react";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { Chip, ChipRow } from "@/components/chip";
import { DataTable } from "@/components/data-table";
import { SoonBadge } from "@/components/coming-soon";
import { ListGroup, ListRow } from "@/components/list-group";
import { CardGrid } from "@/components/page-layout";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { Rise } from "@/components/rise";
import { SampleBadge } from "@/components/sample-badge";
import { StatTile } from "@/components/stat-tile";
import { OrderStatusBadge, ProviderStatusBadge } from "@/components/status-badge";
import { EmptyState, Monogram, ThumbArt } from "@/components/visuals";
import { ORDER_TYPE_ART } from "@/app/provider/icon-map";
import { currentTime, monthKey, monthLabel } from "@/app/provider/day-utils";
import {
  AREAS,
  DEPOSIT_RATE,
  ORDER_STATUS,
  PROVIDER_KINDS,
  PROVIDER_STATUS,
  type OrderStatus,
  type ProviderStatus,
} from "@/lib/constants";
import { formatBaht, formatPhone, formatShortDate } from "@/lib/format";
import { agoLabel, SAMPLE_AUDIT_LOG } from "@/lib/mock/admin-audit-log";
import type { OrderSummary, ProviderSummary, RefundItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/auth";
import { getAdminStats, listAllOrders, listAllProviders, listPendingRefunds } from "@/server/queries";
import { AdminNav } from "./admin-nav";
import { MonthBars, StackedBar, type Bar, type Segment } from "./charts";
import { ProviderStatusActions } from "./provider-status-actions";
import { parseAdminView, type AdminView } from "./views";
import { RefundConfirm } from "./refund-confirm";

export const metadata: Metadata = { title: "ผู้ดูแลระบบ" };

const PROVIDER_STATUS_RANK: Record<ProviderStatus, number> = {
  PENDING: 0,
  VERIFIED: 1,
  REJECTED: 2,
};

const ORDER_DOT: Record<OrderStatus, string> = {
  AWAITING_DEPOSIT: "bg-muted-foreground",
  AWAITING_PROVIDER: "bg-tint-amber-ink",
  CONFIRMED: "bg-tint-sky-ink",
  DONE: "bg-tint-violet-ink",
  COMPLETED: "bg-tint-mint-ink",
  CANCELLED: "bg-tint-rose-ink",
};

const PROVIDER_DOT: Record<ProviderStatus, string> = {
  PENDING: "bg-tint-amber-ink",
  VERIFIED: "bg-tint-mint-ink",
  REJECTED: "bg-tint-rose-ink",
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireRole("ADMIN", "/admin");
  const view = parseAdminView((await searchParams).view);
  const [stats, providers, orders, refunds] = await Promise.all([
    getAdminStats(),
    listAllProviders(),
    listAllOrders(),
    listPendingRefunds(),
  ]);

  // ผู้ให้บริการที่รอตรวจสอบขึ้นก่อน
  const sortedProviders = [...providers].sort(
    (a, b) => PROVIDER_STATUS_RANK[a.status] - PROVIDER_STATUS_RANK[b.status],
  );
  const pendingProviders = sortedProviders.filter((p) => p.status === "PENDING");
  const otherProviders = sortedProviders.filter((p) => p.status !== "PENDING");

  // กราฟทั้งหมดคำนวณจากรายการจริงที่หน้าได้รับ
  const orderSegments: Segment[] = (Object.keys(ORDER_STATUS) as OrderStatus[]).map((status) => ({
    key: status,
    label: ORDER_STATUS[status],
    value: orders.filter((o) => o.status === status).length,
    dot: ORDER_DOT[status],
  }));
  const providerSegments: Segment[] = (Object.keys(PROVIDER_STATUS) as ProviderStatus[]).map((status) => ({
    key: status,
    label: PROVIDER_STATUS[status],
    value: providers.filter((p) => p.status === status).length,
    dot: PROVIDER_DOT[status],
  }));
  const bars = monthBars(orders);

  // เฉพาะตัวเลขที่ต้องใช้ตัดสินใจ: สองช่องแรกพาไปคิวงาน ส่วนจำนวนผู้ให้บริการและงานเสร็จดูได้จากกราฟด้านล่าง
  const tiles = [
    { label: "ผู้ให้บริการรอตรวจสอบ", value: stats.pendingProviders, icon: Clock, href: stats.pendingProviders > 0 ? "/admin?view=queue#queue" : undefined },
    { label: "รอคืนมัดจำ", value: refunds.length, icon: Undo2, href: refunds.length > 0 ? "/admin?view=queue#queue" : undefined },
    { label: "งานที่กำลังดำเนินการ", value: stats.activeOrders, icon: ClipboardList, href: "/admin?view=orders#orders" },
    { label: "คำขอที่รอใบเสนอราคา", value: stats.openRequests, icon: Inbox },
  ];

  const queueCount = pendingProviders.length + refunds.length;

  // มือถือแสดงทุกหมวดต่อกันเหมือนเดิม เดสก์ท็อป (lg) แสดงเฉพาะหมวดที่เลือกในเมนูด้านข้าง
  const show = (v: AdminView) => (view === v ? "" : "lg:hidden");

  return (
    <AppShell width="full" side={<AdminNav current={view} queueCount={queueCount} />}>
      <PageHeader title="ผู้ดูแลระบบ" backHref="/account" backLabel="บัญชี"
        action={<Link href="/admin/finance" className="inline-flex min-h-11 items-center text-base font-medium underline underline-offset-4">การเงินและรายการค้าง</Link>} />

      <Rise className="lg:hidden">
        <nav aria-label="ทางลัดในหน้า">
          <ChipRow>
            <Chip href="#queue">
              ต้องดำเนินการ {queueCount > 0 ? <span className="numeric opacity-70">{queueCount}</span> : null}
            </Chip>
            <Chip href="#overview">ภาพรวม</Chip>
            <Chip href="#providers">ผู้ให้บริการ</Chip>
            <Chip href="#orders">คำสั่งล่าสุด</Chip>
            <Chip href="#system">ระบบ</Chip>
          </ChipRow>
        </nav>
      </Rise>

      <Rise i={1} className={show("overview")}>
        <CardGrid cols="tiles" className="mt-4 gap-3 md:grid-cols-4 lg:mt-0 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.label}>
              <StatTile className="h-full" {...tile} />
            </li>
          ))}
        </CardGrid>
      </Rise>

      <section id="queue" className={cn("scroll-mt-6 lg:scroll-mt-28", show("queue"))}>
        <SectionTitle className="lg:mt-0">ต้องดำเนินการ</SectionTitle>
        {queueCount === 0 ? (
          <p className="text-base text-muted-foreground">
            ไม่มีเรื่องค้าง ผู้สมัครใหม่และการคืนมัดจำจะแสดงที่นี่
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {pendingProviders.length > 0 ? (
              <div id="pending" className="scroll-mt-28">
                <h3 className="mb-3 text-base font-medium">
                  ผู้สมัครรอตรวจสอบ <span className="numeric text-muted-foreground">{pendingProviders.length}</span>
                </h3>
                <ProviderList providers={pendingProviders} />
                <ProviderTable providers={pendingProviders} caption="ผู้สมัครรอตรวจสอบ" />
              </div>
            ) : null}
            {refunds.length > 0 ? (
              <div id="refunds" className="scroll-mt-28">
                <h3 className="mb-1 text-base font-medium">
                  รอคืนมัดจำ <span className="numeric text-muted-foreground">{refunds.length}</span>
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  ตรวจสอบและดำเนินการคืนเงินผ่านหน้าการเงิน ระบบปัจจุบันเป็นโหมดทดสอบ
                </p>
                <RefundList refunds={refunds} />
                <RefundTable refunds={refunds} />
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section id="overview" className={cn("scroll-mt-6 lg:scroll-mt-28", show("overview"))}>
        <SectionTitle>ภาพรวมของระบบ</SectionTitle>
        <div className="grid gap-8 xl:grid-cols-2 xl:gap-12">
          <div>
            <h3 className="mb-4 text-base font-medium">คำสั่งตามสถานะ</h3>
            <StackedBar segments={orderSegments} emptyLabel="ยังไม่มีคำสั่ง" />
          </div>
          <div>
            <h3 className="mb-4 text-base font-medium">ผู้ให้บริการตามสถานะ</h3>
            <StackedBar segments={providerSegments} emptyLabel="ยังไม่มีผู้ให้บริการ" />
          </div>
          <div className="border-t border-border pt-6 xl:col-span-2">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-base font-medium">มูลค่าคำสั่งรายเดือน</h3>
              <p className="text-sm text-muted-foreground">หน่วยพันบาท ไม่รวมงานที่ยกเลิก</p>
            </div>
            <MonthBars bars={bars} emptyLabel="ยังไม่มีมูลค่าคำสั่งใน 6 เดือนล่าสุด" />
          </div>
        </div>
      </section>

      <section id="providers" className={cn("scroll-mt-6 lg:scroll-mt-28", show("providers"))}>
        <SectionTitle className="lg:mt-0">ผู้ให้บริการ</SectionTitle>
        {sortedProviders.length === 0 ? (
          <EmptyState
            art="garland"
            title="ยังไม่มีผู้ให้บริการ"
            description="เมื่อมีผู้สมัครเป็นผู้ให้บริการ รายการจะแสดงที่นี่"
          />
        ) : (
          <>
            {/* มือถือ: ผู้สมัครรอตรวจสอบอยู่ในหมวด "ต้องดำเนินการ" แล้ว จึงแสดงเฉพาะรายอื่น */}
            <div className="lg:hidden">
              <ProviderList providers={otherProviders} />
            </div>
            <div className="hidden lg:block xl:hidden">
              <ProviderList providers={sortedProviders} />
            </div>
            <ProviderTable providers={sortedProviders} caption="ผู้ให้บริการทั้งหมด" />
          </>
        )}
      </section>

      <section id="orders" className={cn("scroll-mt-6 lg:scroll-mt-28", show("orders"))}>
        <SectionTitle className="lg:mt-0">คำสั่งล่าสุด</SectionTitle>
        {orders.length === 0 ? (
          <EmptyState art="garland" title="ยังไม่มีคำสั่ง" description="คำสั่งจากลูกค้าจะแสดงที่นี่" />
        ) : (
          <>
            <ListGroup label="คำสั่งล่าสุด" className="xl:hidden">
              {orders.map((order) => (
                <ListRow
                  key={order.id}
                  href={`/provider/orders/${order.id}`}
                  thumb={<ThumbArt service={ORDER_TYPE_ART[order.type]} size="md" />}
                  title={<span className="line-clamp-2">{order.title}</span>}
                  meta={`${order.customerName} · ร้าน ${order.providerName} · ${formatShortDate(order.createdAt)}`}
                  trailing={
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Price amount={order.total} size="sm" />
                      <OrderStatusBadge status={order.status} />
                    </span>
                  }
                />
              ))}
            </ListGroup>
            <DataTable
              from="xl"
              caption="คำสั่งล่าสุดทั้งหมด"
              rows={orders}
              rowKey={(o) => o.id}
              rowHref={(o) => `/provider/orders/${o.id}`}
              columns={[
                {
                  key: "title",
                  header: "รายการ",
                  className: "w-full",
                  cell: (o) => (
                    <span className="flex items-center gap-4">
                      <ThumbArt service={ORDER_TYPE_ART[o.type]} size="sm" />
                      <span className="min-w-0">
                        <span className="line-clamp-1 block">{o.title}</span>
                        <span className="numeric block text-sm font-normal text-muted-foreground">
                          {o.code} · {formatShortDate(o.createdAt)}
                        </span>
                      </span>
                    </span>
                  ),
                },
                {
                  key: "who",
                  header: "ลูกค้า / ร้าน",
                  className: "max-w-56",
                  cell: (o) => (
                    <span className="block">
                      <span className="block">{o.customerName}</span>
                      <span className="block text-sm text-muted-foreground">{o.providerName}</span>
                    </span>
                  ),
                },
                { key: "status", header: "สถานะ", cell: (o) => <OrderStatusBadge status={o.status} /> },
                {
                  key: "total",
                  header: "ยอด",
                  align: "right",
                  cell: (o) => formatBaht(o.total),
                  className: "whitespace-nowrap",
                },
              ]}
            />
          </>
        )}
      </section>

      <section id="system" className={cn("scroll-mt-6 lg:scroll-mt-28", show("system"))}>
        <div className="max-w-3xl">
          <SectionTitle className="lg:mt-0">ระบบ</SectionTitle>
          <ListGroup label="การตั้งค่าระบบ">
            <ListRow
              title="อัตรามัดจำ"
              meta="ค่าสมมติ รอการตัดสินใจทางธุรกิจ"
              trailing={<span className="numeric font-display text-lg font-normal">{Math.round(DEPOSIT_RATE * 100)}%</span>}
            />
            <ListRow title="ค่าบริการแพลตฟอร์ม" meta="ส่วนแบ่งต่อคำสั่ง" trailing={<SoonBadge />} />
            <ListRow title="รอบโอนเงินให้ร้าน" meta="กำหนดวันโอนและบัญชีรับเงิน" trailing={<SoonBadge />} />
          </ListGroup>

          <SectionTitle action={<SampleBadge />}>กิจกรรมล่าสุดของทีมงาน</SectionTitle>
          <ListGroup label="กิจกรรมล่าสุดของทีมงาน">
            {SAMPLE_AUDIT_LOG.map((entry) => (
              <ListRow
                key={entry.id}
                title={entry.summary}
                meta={`${entry.actor} · ${agoLabel(entry.minutesAgo)}`}
              />
            ))}
          </ListGroup>
          <p className="mt-3 text-sm text-muted-foreground">
            ตัวอย่างหน้าตาเท่านั้น ระบบยังไม่ได้บันทึกประวัติการทำงานของทีมงาน
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function areaText(p: ProviderSummary) {
  return p.areas.length > 0 ? p.areas.map((a) => AREAS[a]).join(" · ") : "ยังไม่ระบุพื้นที่";
}

/** รายการผู้ให้บริการแบบแถวหนาแน่น (มือถือ และต่ำกว่า xl บนเดสก์ท็อป) ผู้สมัครรอตรวจสอบมีปุ่มอนุมัติในแถว */
function ProviderList({ providers }: { providers: ProviderSummary[] }) {
  if (providers.length === 0) return null;
  return (
    <ListGroup label="ผู้ให้บริการ" className="xl:hidden">
      {providers.map((p) => (
        <li key={p.id} className="px-4 py-4">
          <div className="flex items-start gap-4">
            <Monogram name={p.name} />
            <div className="min-w-0 flex-1">
              <p className="text-base leading-snug font-medium">
                {p.status === "VERIFIED" ? (
                  <Link href={`/shops/${p.id}`} className="underline-offset-4 hover:underline">
                    {p.name}
                  </Link>
                ) : (
                  p.name
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {PROVIDER_KINDS[p.kind]} · {areaText(p)}
              </p>
              <a
                href={`tel:${p.phone}`}
                className="numeric inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {formatPhone(p.phone)}
              </a>
            </div>
            <ProviderStatusBadge status={p.status} />
          </div>
          {p.status === "PENDING" && p.description ? (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
          ) : null}
          <div className="mt-3">
            <ProviderStatusActions providerId={p.id} status={p.status} />
          </div>
        </li>
      ))}
    </ListGroup>
  );
}

/** ตารางผู้ให้บริการบนเดสก์ท็อป (xl) พร้อมปุ่มเปลี่ยนสถานะในแถว */
function ProviderTable({ providers, caption }: { providers: ProviderSummary[]; caption: string }) {
  return (
    <DataTable
      from="xl"
      caption={caption}
      rows={providers}
      rowKey={(p) => p.id}
      columns={[
        {
          key: "name",
          header: "ผู้ให้บริการ",
          className: "w-full",
          cell: (p) => (
            <span className="flex min-w-52 items-center gap-4">
              <Monogram name={p.name} size="sm" />
              <span className="min-w-0">
                <span className="block font-medium">
                  {p.status === "VERIFIED" ? (
                    <Link href={`/shops/${p.id}`} className="underline-offset-4 hover:underline">
                      {p.name}
                    </Link>
                  ) : (
                    p.name
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {PROVIDER_KINDS[p.kind]} ·{" "}
                  <a href={`tel:${p.phone}`} className="numeric underline-offset-4 hover:underline">
                    {formatPhone(p.phone)}
                  </a>
                </span>
                {p.status === "PENDING" && p.description ? (
                  <span className="mt-0.5 line-clamp-2 block max-w-md text-sm text-muted-foreground">
                    {p.description}
                  </span>
                ) : null}
              </span>
            </span>
          ),
        },
        {
          key: "area",
          header: "พื้นที่ / คะแนน",
          className: "max-w-72 min-w-56",
          cell: (p) => (
            <span className="block">
              <span className="block text-muted-foreground">{areaText(p)}</span>
              <Rating value={p.rating} count={p.rating === null ? undefined : p.reviewCount} size="sm" />
            </span>
          ),
        },
        { key: "status", header: "สถานะ", cell: (p) => <ProviderStatusBadge status={p.status} /> },
        {
          key: "actions",
          header: "จัดการ",
          className: "w-px",
          cell: (p) => <ProviderStatusActions providerId={p.id} status={p.status} compact />,
        },
      ]}
    />
  );
}

/** รายการรอคืนมัดจำบนมือถือ */
function RefundList({ refunds }: { refunds: RefundItem[] }) {
  return (
    <ListGroup label="รอคืนมัดจำ" className="xl:hidden">
      {refunds.map((refund) => (
        <li key={refund.id} className="px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={`/provider/orders/${refund.id}`}
                className="line-clamp-2 text-base leading-snug font-medium underline-offset-4 hover:underline"
              >
                {refund.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                เลขที่ <span className="numeric">{refund.code}</span> · ร้าน {refund.providerName}
              </p>
            </div>
            <Price amount={refund.refundAmount} size="lg" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            ลูกค้า {refund.customerName} ·{" "}
            <a href={`tel:${refund.customerPhone}`} className="numeric underline-offset-4 hover:underline">
              {formatPhone(refund.customerPhone)}
            </a>
          </p>
          <div className="mt-3">
            <RefundConfirm orderId={refund.id} />
          </div>
        </li>
      ))}
    </ListGroup>
  );
}

/** ตารางรอคืนมัดจำบนเดสก์ท็อป: ยืนยันในแถวได้เลย */
function RefundTable({ refunds }: { refunds: RefundItem[] }) {
  return (
    <DataTable
      from="xl"
      caption="รอคืนมัดจำ"
      rows={refunds}
      rowKey={(r) => r.id}
      rowHref={(r) => `/provider/orders/${r.id}`}
      columns={[
        {
          key: "title",
          header: "คำสั่ง",
          className: "w-full",
          cell: (r) => (
            <span className="block">
              <span className="line-clamp-1 block">{r.title}</span>
              <span className="numeric block text-sm font-normal text-muted-foreground">
                {r.code} · ร้าน {r.providerName}
              </span>
            </span>
          ),
        },
        {
          key: "customer",
          header: "ลูกค้า",
          className: "whitespace-nowrap",
          cell: (r) => (
            <span className="relative z-10 block">
              <span className="block">{r.customerName}</span>
              <a href={`tel:${r.customerPhone}`} className="numeric text-sm text-muted-foreground underline-offset-4 hover:underline">
                {formatPhone(r.customerPhone)}
              </a>
            </span>
          ),
        },
        {
          key: "amount",
          header: "ยอดที่ต้องคืน",
          align: "right",
          className: "whitespace-nowrap",
          cell: (r) => formatBaht(r.refundAmount),
        },
        {
          key: "action",
          header: "จัดการ",
          className: "w-px",
          cell: (r) => (
            <span className="relative z-10 block">
              <RefundConfirm orderId={r.id} compact />
            </span>
          ),
        },
      ]}
    />
  );
}

/** มูลค่าคำสั่ง (ไม่รวมที่ยกเลิก) ของ 6 เดือนล่าสุดถึงเดือนปัจจุบัน เดือนที่ไม่มีงานแสดงเป็นศูนย์ */
function monthBars(orders: OrderSummary[]): Bar[] {
  const totals = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "CANCELLED") continue;
    const key = monthKey(o.createdAt);
    totals.set(key, (totals.get(key) ?? 0) + o.total);
  }
  const [year, month] = monthKey(currentTime()).split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const index = year * 12 + (month - 1) - offset;
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const value = totals.get(key) ?? 0;
    return {
      key,
      label: monthLabel(`${key}-15T12:00:00+07:00`),
      value,
      display: `${Math.round(value / 100) / 10}`,
    };
  });
}
