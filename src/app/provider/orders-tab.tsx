import { Check, Hourglass } from "lucide-react";
import { SectionTitle } from "@/components/app-shell";
import { Chip, ChipRow } from "@/components/chip";
import { DataTable } from "@/components/data-table";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Price } from "@/components/price";
import { OrderStatusBadge, TonePill } from "@/components/status-badge";
import { EmptyState, ThumbArt } from "@/components/visuals";
import { BIZ_TIPS } from "@/lib/mock/biz-tips";
import { formatBaht, formatShortDate } from "@/lib/format";
import type { OrderSummary, ProviderRequest, ProviderSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { currentTime, dayKey, dayParts, timeLabel } from "./day-utils";
import { ORDER_TYPE_ART } from "./icon-map";
import { Split } from "./split";

export type OrderFilter = "all" | "awaiting" | "active" | "completed";

export function parseOrderFilter(raw: string | string[] | undefined): OrderFilter {
  return raw === "awaiting" || raw === "active" || raw === "completed" ? raw : "all";
}

function dayHeading(key: string, todayKey: string, tomorrowKey: string, sample: string) {
  const p = dayParts(sample);
  const date = `${p.weekdayShort} ${p.day} ${p.month}`;
  if (key === todayKey) return `วันนี้ · ${date}`;
  if (key === tomorrowKey) return `พรุ่งนี้ · ${date}`;
  return `${p.weekday} ${p.day} ${p.month}`;
}

/** แท็บ "งาน": ต้องทำตอนนี้ ตารางนัด 7 วัน แล้วรายการงานทั้งหมด (กรองด้วยชิป) ตัวเลขทั้งหมดคำนวณจากงานจริง */
export function OrdersTab({
  provider,
  orders,
  requests,
  productCount,
  packageCount,
  filter,
}: {
  provider: ProviderSummary;
  orders: OrderSummary[];
  requests: ProviderRequest[];
  productCount: number;
  packageCount: number;
  filter: OrderFilter;
}) {
  const verified = provider.status === "VERIFIED";
  const now = currentTime();
  const today = dayKey(now);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000));
  const weekEnd = dayKey(new Date(now.getTime() + 7 * 86_400_000));

  const awaiting = orders.filter((o) => o.status === "AWAITING_PROVIDER");
  const active = orders.filter((o) => o.status === "CONFIRMED" || o.status === "DONE");
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const totalValue = orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.total, 0);

  const upcoming = orders
    .filter((o): o is OrderSummary & { scheduledAt: string } => o.status === "CONFIRMED" && o.scheduledAt !== null)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const overdue = upcoming.filter((o) => dayKey(o.scheduledAt) < today);
  const agendaOrders = upcoming.filter((o) => {
    const k = dayKey(o.scheduledAt);
    return k >= today && k <= weekEnd;
  });
  const agenda: { key: string; label: string; orders: typeof agendaOrders }[] = [];
  for (const o of agendaOrders) {
    const k = dayKey(o.scheduledAt);
    const last = agenda[agenda.length - 1];
    if (last && last.key === k) last.orders.push(o);
    else agenda.push({ key: k, label: dayHeading(k, today, tomorrow, o.scheduledAt), orders: [o] });
  }
  const requestsToQuote = verified ? requests.filter((r) => r.myQuote === null) : [];
  const todoCount = awaiting.length + overdue.length + (requestsToQuote.length > 0 ? 1 : 0);

  const listed =
    filter === "awaiting" ? awaiting : filter === "active" ? active : filter === "completed" ? completed : orders;

  const readiness = [
    { key: "desc", done: provider.description.trim().length > 0, label: "เขียนแนะนำร้านสั้น ๆ", href: "/provider?tab=profile" },
    { key: "product", done: productCount > 0, label: "เพิ่มศาลที่ขายอย่างน้อย 1 รายการ", href: "/provider/products/new" },
    { key: "package", done: packageCount > 0, label: "เพิ่มบริการเสริม เช่น พิธีตั้งศาล", href: "/provider/packages/new" },
    { key: "verified", done: verified, label: "ผ่านการตรวจสอบจากทีมงาน", href: "" },
  ];
  const readyDone = readiness.filter((r) => r.done).length;

  const aside = (
    <div className="flex flex-col gap-8">
      {readyDone < readiness.length ? <Readiness items={readiness} done={readyDone} /> : null}
      {orders.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground">มูลค่างานรวม</p>
          <Price amount={totalValue} size="xl" />
          <p className="mt-0.5 text-sm text-muted-foreground">ไม่รวมงานที่ยกเลิก</p>
        </div>
      ) : null}
      <Tips />
    </div>
  );

  const main =
    orders.length === 0 ? (
      <EmptyState
        title="ยังไม่มีงาน"
        description="งานจากลูกค้าที่จ่ายมัดจำแล้วจะแสดงที่นี่"
        action={
          <LinkButton href="/provider?tab=requests" variant="secondary" size="xl">
            ดูคำขอในพื้นที่ของคุณ
          </LinkButton>
        }
      />
    ) : (
      <div>
        <ChipRow label="กรองงาน" className="mt-0">
          <Chip href="/provider?tab=orders" active={filter === "all"}>
            ทั้งหมด <span className="numeric">{orders.length}</span>
          </Chip>
          {awaiting.length > 0 ? (
            <Chip href="/provider?tab=orders&f=awaiting" active={filter === "awaiting"}>
              รอยืนยัน <span className="numeric">{awaiting.length}</span>
            </Chip>
          ) : null}
          {active.length > 0 ? (
            <Chip href="/provider?tab=orders&f=active" active={filter === "active"}>
              กำลังทำ <span className="numeric">{active.length}</span>
            </Chip>
          ) : null}
          {completed.length > 0 ? (
            <Chip href="/provider?tab=orders&f=completed" active={filter === "completed"}>
              เสร็จสมบูรณ์ <span className="numeric">{completed.length}</span>
            </Chip>
          ) : null}
        </ChipRow>

        {filter === "all" ? (
          <>
            <SectionTitle className="mt-6 lg:mt-8">ต้องทำตอนนี้</SectionTitle>
            {todoCount === 0 ? (
              <p className="text-base text-muted-foreground">ไม่มีเรื่องค้าง งานที่ต้องตอบรับจะขึ้นที่นี่</p>
            ) : (
              <ListGroup label="ต้องทำตอนนี้">
                {awaiting.map((o) => (
                  <OrderRow key={o.id} order={o} meta={`${o.customerName} · รอคุณยืนยัน`} />
                ))}
                {overdue.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    meta={`${o.customerName} · นัด ${formatShortDate(o.scheduledAt)} ${timeLabel(o.scheduledAt)}`}
                    trailing={<TonePill tone="wait">เลยวันนัด</TonePill>}
                  />
                ))}
                {requestsToQuote.length > 0 ? (
                  <ListRow
                    href="/provider?tab=requests&f=todo"
                    title={`คำขอรอใบเสนอราคา ${requestsToQuote.length} รายการ`}
                    meta="ลูกค้าในพื้นที่ของร้านกำลังรอราคา"
                  />
                ) : null}
              </ListGroup>
            )}

            {agenda.length > 0 ? (
              <>
                <SectionTitle className="mt-8 lg:mt-10">นัดหมาย 7 วันข้างหน้า</SectionTitle>
                <div className="flex flex-col gap-5">
                  {agenda.map((day) => (
                    <section key={day.key} aria-label={day.label}>
                      <h3 className="mb-2 px-1 text-sm font-medium text-muted-foreground">{day.label}</h3>
                      <ListGroup>
                        {day.orders.map((o) => (
                          <OrderRow
                            key={o.id}
                            order={o}
                            meta={`${timeLabel(o.scheduledAt)} · ${o.customerName}`}
                          />
                        ))}
                      </ListGroup>
                    </section>
                  ))}
                </div>
              </>
            ) : null}

            <SectionTitle className="mt-8 lg:mt-10">งานทั้งหมด</SectionTitle>
          </>
        ) : (
          <div className="mt-5" />
        )}

        <ListGroup label="งาน" className="xl:hidden">
          {listed.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              meta={`${o.customerName} · ${
                o.scheduledAt
                  ? `นัด ${formatShortDate(o.scheduledAt)} ${timeLabel(o.scheduledAt)}`
                  : `สั่งเมื่อ ${formatShortDate(o.createdAt)}`
              }`}
              trailing={
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Price amount={o.total} size="sm" />
                  <OrderStatusBadge status={o.status} />
                </span>
              }
            />
          ))}
        </ListGroup>
        <DataTable
          from="xl"
          caption="งานทั้งหมดของร้าน"
          rows={listed}
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
                    <span className="numeric block text-sm font-normal text-muted-foreground">{o.code}</span>
                  </span>
                </span>
              ),
            },
            { key: "customer", header: "ลูกค้า", className: "whitespace-nowrap", cell: (o) => o.customerName },
            { key: "status", header: "สถานะ", cell: (o) => <OrderStatusBadge status={o.status} /> },
            {
              key: "when",
              header: "นัดหมาย",
              className: "whitespace-nowrap text-muted-foreground",
              cell: (o) =>
                o.scheduledAt
                  ? `${formatShortDate(o.scheduledAt)} ${timeLabel(o.scheduledAt)}`
                  : `สั่งเมื่อ ${formatShortDate(o.createdAt)}`,
            },
            {
              key: "total",
              header: "ยอดรวม",
              align: "right",
              className: "whitespace-nowrap",
              cell: (o) => formatBaht(o.total),
            },
          ]}
        />
      </div>
    );

  return (
    <div className="mt-5 lg:mt-8">
      <Split asideFirst={orders.length === 0} aside={aside}>
        {main}
      </Split>
    </div>
  );
}

function OrderRow({
  order,
  meta,
  trailing,
}: {
  order: OrderSummary;
  meta: string;
  trailing?: React.ReactNode;
}) {
  return (
    <ListRow
      href={`/provider/orders/${order.id}`}
      thumb={<ThumbArt service={ORDER_TYPE_ART[order.type]} size="md" />}
      title={<span className="line-clamp-2">{order.title}</span>}
      meta={meta}
      trailing={trailing ?? <Price amount={order.total} size="sm" />}
    />
  );
}

function Readiness({
  items,
  done,
}: {
  items: { key: string; done: boolean; label: string; href: string }[];
  done: number;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-baseline justify-between gap-3 text-base font-medium">
        ทำให้ร้านพร้อมรับงาน
        <span className="numeric text-sm font-normal text-muted-foreground">
          {done}/{items.length}
        </span>
      </h2>
      <ListGroup label="ความพร้อมของร้าน">
        {items.map((item) => (
          <ListRow
            key={item.key}
            href={!item.done && item.href ? item.href : undefined}
            thumb={
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  item.done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {item.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
            }
            title={
              <span className={cn("font-normal", item.done && "text-muted-foreground line-through")}>
                {item.label}
              </span>
            }
            trailing={!item.done && !item.href ? <Hourglass className="size-5 text-muted-foreground" aria-hidden="true" /> : undefined}
          />
        ))}
      </ListGroup>
    </section>
  );
}

function Tips() {
  return (
    <section>
      <h2 className="mb-1 text-base font-medium">เคล็ดลับสำหรับร้าน</h2>
      <p className="mb-3 text-sm text-muted-foreground">แนวทางทั่วไป ไม่ใช่ข้อมูลของร้านคุณ</p>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {BIZ_TIPS.map((tip) => (
          <li key={tip.id} className="py-3">
            <p className="text-base font-medium">{tip.title}</p>
            <p className="text-sm text-muted-foreground">{tip.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
