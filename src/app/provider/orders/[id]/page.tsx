import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { Rise } from "@/components/rise";
import { StatusLine } from "@/components/status-line";
import { TonePill, type Tone } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Monogram } from "@/components/visuals";
import { OrderChat } from "@/app/orders/[id]/order-chat";
import {
  AREAS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  PLACE_TYPES,
  SHRINE_KINDS,
  type OrderStatus,
} from "@/lib/constants";
import { formatBaht, formatPhone, formatShortDate } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getMyProvider, getOrder } from "@/server/queries";
import { AdminNav } from "@/app/admin/admin-nav";
import { loadAdminQueueCount } from "@/app/admin/nav-data";
import { dayParts, timeLabel } from "../../day-utils";
import { loadProviderNavBadges } from "../../nav-data";
import { ProviderNav } from "../../provider-nav";
import { Split } from "../../split";
import { ProviderOrderActions } from "./order-actions";

export const metadata: Metadata = { title: "รายละเอียดงาน" };

type EventRole = OrderDetail["events"][number]["byRole"];

const EVENT_ROLE: Record<EventRole, string> = {
  CUSTOMER: "ลูกค้า",
  PROVIDER: "ร้าน",
  ADMIN: "ผู้ดูแลระบบ",
  SYSTEM: "ระบบ",
};

const PAYMENT_TONE: Record<keyof typeof PAYMENT_STATUS, Tone> = {
  PENDING: "wait",
  PAID: "good",
  FAILED: "bad",
  REFUNDED: "neutral",
};

const FLOW_STEPS = ["รอยืนยัน", "รับงานแล้ว", "ส่งงานแล้ว", "เสร็จสมบูรณ์"];
const FLOW_CURRENT: Record<OrderStatus, number> = {
  AWAITING_DEPOSIT: 0,
  AWAITING_PROVIDER: 0,
  CONFIRMED: 1,
  DONE: 2,
  COMPLETED: 4,
  CANCELLED: 0,
};

/** ประโยคสถานะเดียวของงาน (แทนป้าย + ตัวบอกขั้นตอน + กล่องแจ้งที่เคยซ้ำกัน) */
function statusSentence(order: OrderDetail, depositPaid: boolean) {
  const when = order.scheduledAt
    ? `นัด ${dayParts(order.scheduledAt).weekdayShort} ${dayParts(order.scheduledAt).day} ${dayParts(order.scheduledAt).month} ${timeLabel(order.scheduledAt)}`
    : undefined;
  switch (order.status) {
    case "AWAITING_DEPOSIT":
      return { title: "รอลูกค้าจ่ายมัดจำ", detail: undefined, tone: "wait" as const };
    case "AWAITING_PROVIDER":
      return {
        title: "รอคุณยืนยันรับงาน",
        detail: depositPaid ? "ลูกค้าจ่ายมัดจำแล้ว" : undefined,
        tone: "wait" as const,
      };
    case "CONFIRMED":
      return { title: "รับงานแล้ว เตรียมไปทำงาน", detail: when, tone: "info" as const };
    case "DONE":
      return { title: "ส่งงานแล้ว รอลูกค้าตรวจรับ", detail: "ลูกค้าจะจ่ายส่วนที่เหลือเมื่อตรวจรับงาน", tone: "info" as const };
    case "COMPLETED":
      return { title: "งานเสร็จสมบูรณ์", detail: when, tone: "good" as const };
    case "CANCELLED":
      return { title: "งานนี้ถูกยกเลิก", detail: "ไม่มีขั้นตอนที่ต้องทำต่อ", tone: "bad" as const };
  }
}

export default async function OrderDetailPage({ params }: PageProps<"/provider/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/provider/orders/${id}`);
  const order = await getOrder(id, user);
  if (!order || order.viewerIs === "CUSTOMER") notFound();

  const isProvider = order.viewerIs === "PROVIDER";
  const backHref = order.viewerIs === "ADMIN" ? "/admin" : "/provider";
  const cancelled = order.status === "CANCELLED";
  const showActions = isProvider && (order.status === "AWAITING_PROVIDER" || order.status === "CONFIRMED");
  const depositPaid = order.payments.some((p) => p.kind === "DEPOSIT" && p.status === "PAID");

  // เมนูด้านข้างบนเดสก์ท็อป: ผู้ดูแลระบบที่เปิดดูงานนี้ได้เมนูหลังบ้าน ร้านได้เมนูร้าน
  let nav: React.ReactNode;
  if (order.viewerIs === "ADMIN") {
    nav = <AdminNav current="orders" queueCount={await loadAdminQueueCount()} />;
  } else {
    const provider = await getMyProvider(user.id);
    nav = <ProviderNav current="orders" badges={provider ? await loadProviderNavBadges(provider) : undefined} />;
  }

  const sentence = statusSentence(order, depositPaid);

  const siteRows: { label: string; value: React.ReactNode }[] = [];
  if (order.scheduledAt) {
    const p = dayParts(order.scheduledAt);
    siteRows.push({ label: "นัดหมาย", value: `${p.weekday} ${p.day} ${p.month} · ${timeLabel(order.scheduledAt)}` });
  } else if (order.preferredDates.length > 0) {
    siteRows.push({
      label: "ลูกค้าสะดวก",
      value: order.preferredDates
        .map((date) => {
          const p = dayParts(`${date}T12:00:00+07:00`);
          return `${p.weekdayShort} ${p.day} ${p.month}`;
        })
        .join(" · "),
    });
  }
  siteRows.push({
    label: "สถานที่",
    value: (
      <>
        {AREAS[order.area]}
        <span className="block text-muted-foreground">{order.address}</span>
        {order.placeType ? <span className="block text-muted-foreground">{PLACE_TYPES[order.placeType]}</span> : null}
      </>
    ),
  });
  if (order.shrineKind) siteRows.push({ label: "ประเภทศาล", value: SHRINE_KINDS[order.shrineKind] });
  if (order.note) siteRows.push({ label: "หมายเหตุ", value: <span className="whitespace-pre-line">{order.note}</span> });

  const siteDetails = (
    <section aria-labelledby="site-heading">
      <h2 id="site-heading" className="mb-3 text-base font-medium">
        หน้างาน
      </h2>
      <dl className="divide-y divide-border border-y border-border">
        {siteRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-base">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  const customerCard = (
    <section className="surface p-5" aria-label="ลูกค้า">
      <div className="flex items-center gap-4">
        <Monogram name={order.customerName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-snug font-medium">{order.customerName}</p>
          <p className="numeric text-base text-muted-foreground">{formatPhone(order.customerPhone)}</p>
        </div>
      </div>
      <a
        href={`tel:${order.customerPhone}`}
        className={cn(buttonVariants({ variant: "outline", size: "xl" }), "mt-4 w-full")}
      >
        <Phone />
        โทรหาลูกค้า
      </a>
    </section>
  );

  const summaryCard = (
    <section className="surface p-5" aria-label="สรุปยอด">
      <h2 className="text-base font-medium">สรุปยอด</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 text-base">
            <span className="min-w-0">{item.name}</span>
            <span className="numeric shrink-0">{formatBaht(item.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-base">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">ยอดรวม</span>
          <span className="numeric">{formatBaht(order.total)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-wrap items-center gap-2 text-muted-foreground">
            มัดจำ
            {depositPaid ? <TonePill tone="good">จ่ายแล้ว</TonePill> : null}
          </span>
          <span className="numeric">{formatBaht(order.deposit)}</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="font-medium">ส่วนที่เหลือ</span>
        <Price amount={order.balance} size="lg" />
      </div>
      <p className="mt-1 text-right text-sm text-muted-foreground">ลูกค้าจ่ายเมื่อตรวจรับงาน</p>
    </section>
  );

  const main = (
    <div className="flex flex-col gap-8">
      <div className="max-xl:hidden">{siteDetails}</div>

      <OrderChat
        orderId={order.id}
        messages={order.messages}
        disabled={cancelled}
        counterpartLabel="ลูกค้า"
      />

      {order.review ? (
        <section aria-label="รีวิวจากลูกค้า">
          <h2 className="mb-3 text-base font-medium">รีวิวจากลูกค้า</h2>
          <Rating value={order.review.rating} />
          {order.review.comment ? (
            <p className="mt-3 text-base whitespace-pre-line">{order.review.comment}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">{formatShortDate(order.review.createdAt)}</p>
        </section>
      ) : null}

      {order.events.length > 0 ? (
        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="mb-4 text-base font-medium">
            ความคืบหน้า
          </h2>
          <ol className="ml-1 border-l border-border">
            {order.events.map((event, i) => (
              <li key={event.id} className={cn("relative pl-5", i < order.events.length - 1 && "pb-6")}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-2 -left-[5px] size-2.5 rounded-full",
                    i === order.events.length - 1 ? "bg-gold" : "bg-foreground",
                  )}
                />
                <p className="text-base leading-snug font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {EVENT_ROLE[event.byRole]} · {formatShortDate(event.createdAt)} {timeLabel(event.createdAt)}
                </p>
                {event.note ? <p className="mt-2 text-base whitespace-pre-line">{event.note}</p> : null}
                {event.photoUrl ? (
                  <div className="relative mt-3 aspect-video w-full max-w-xs overflow-hidden rounded-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.photoUrl} alt="รูปความคืบหน้า" className="size-full object-cover" />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {order.payments.length > 0 ? (
        <section aria-labelledby="payments-heading">
          <h2 id="payments-heading" className="mb-3 text-base font-medium">
            การชำระเงิน
          </h2>
          <ListGroup>
            {order.payments.map((payment) => (
              <ListRow
                key={payment.id}
                title={payment.kind === "DEPOSIT" ? "มัดจำ" : "ส่วนที่เหลือ"}
                meta={`${PAYMENT_METHODS[payment.method]}${payment.paidAt ? ` · ${formatShortDate(payment.paidAt)}` : ""}`}
                trailing={
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Price amount={payment.amount} size="sm" />
                    <TonePill tone={PAYMENT_TONE[payment.status]}>{PAYMENT_STATUS[payment.status]}</TonePill>
                  </span>
                }
              />
            ))}
          </ListGroup>
        </section>
      ) : null}
    </div>
  );

  // มือถือ: สถานะ → สิ่งที่ต้องทำ → ลูกค้า → หน้างาน → สรุปยอด → แชตและประวัติ
  // xl ขึ้นไป: สถานะเต็มความกว้าง ซ้าย = หน้างาน แชต ประวัติ ขวา = สิ่งที่ต้องทำ ลูกค้า สรุปยอด
  return (
    <AppShell width="full" side={nav}>
      <PageHeader
        eyebrow={`เลขที่ ${order.code}`}
        title={order.title}
        backHref={backHref}
        backLabel={order.viewerIs === "ADMIN" ? "ผู้ดูแลระบบ" : "ร้านของฉัน"}
      />

      <Rise>
        <StatusLine
          title={sentence.title}
          detail={sentence.detail}
          tone={sentence.tone}
          steps={cancelled ? undefined : FLOW_STEPS}
          step={FLOW_CURRENT[order.status]}
        />
      </Rise>

      <Rise i={1} className="mt-6">
        <Split
          asideFirst
          sticky={!showActions}
          aside={
            <div className="flex flex-col gap-5">
              {showActions ? (
                <section aria-label="สิ่งที่ต้องทำ">
                  <ProviderOrderActions
                    orderId={order.id}
                    status={order.status}
                    preferredDates={order.preferredDates}
                  />
                </section>
              ) : null}
              {customerCard}
              <div className="xl:hidden">{siteDetails}</div>
              {summaryCard}
            </div>
          }
        >
          {main}
        </Split>
      </Rise>
    </AppShell>
  );
}
