import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { Rise } from "@/components/rise";
import { StatusLine } from "@/components/status-line";
import { TonePill } from "@/components/status-badge";
import { ExpandableMap } from "@/components/map/expandable-map";
import { MapView } from "@/components/map/map-view";
import { SidePanel, TwoColumn } from "@/components/page-layout";
import { EmptyState, Monogram } from "@/components/visuals";
import { cn } from "@/lib/utils";
import { AREAS, DEPOSIT_RATE, REQUEST_TYPES } from "@/lib/constants";
import { formatBaht, formatShortDate } from "@/lib/format";
import type { QuoteDTO, RequestDetail } from "@/lib/types";
import { requireUser } from "@/server/auth";
import { getMyRequest } from "@/server/queries";
import { VerifiedPill } from "@/app/shops/public-parts";
import { AcceptQuoteButton, CloseRequestButton } from "./request-actions";

export const metadata: Metadata = { title: "คำขอใบเสนอราคา" };

const FLOW = ["ส่งคำขอ", "ร้านเสนอราคา", "คุณเลือกร้าน"];
const DEPOSIT_PCT = Math.round(DEPOSIT_RATE * 100);

/** ประโยคสถานะเดียวของคำขอ: จำนวนใบเสนอที่ได้รับ และขั้นต่อไป */
function describe(request: RequestDetail): {
  title: string;
  detail?: string;
  tone: "wait" | "good" | "neutral";
  step?: number;
} {
  const sent = request.quotes.filter((q) => q.status !== "DECLINED").length;
  if (request.status === "ACCEPTED") {
    return { title: "คุณเลือกร้านแล้ว", detail: "จ่ายมัดจำที่หน้าคำสั่งซื้อ แล้วร้านจะนัดวันเข้างาน", tone: "good", step: FLOW.length };
  }
  if (request.status === "CLOSED") {
    return { title: "ปิดคำขอแล้ว", detail: "ร้านจะไม่เห็นคำขอนี้อีก", tone: "neutral" };
  }
  if (request.quotes.length === 0) {
    return { title: "รอร้านเสนอราคา", detail: "ใบเสนอราคาจะขึ้นที่หน้านี้เมื่อร้านตอบกลับ", tone: "wait", step: 1 };
  }
  return {
    title: `ได้รับใบเสนอราคา ${sent} ใบ เลือกร้านที่ต้องการ`,
    detail: `หลังเลือกร้าน คุณจ่ายมัดจำ ${DEPOSIT_PCT}% แล้วร้านจะนัดวันเข้างาน`,
    tone: "wait",
    step: 2,
  };
}

/** แยกหมายเหตุของร้านเป็นหลายข้อเมื่อมีหลายบรรทัด */
function noteLines(note: string): string[] {
  return note
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-•*·]+/, "").trim())
    .filter(Boolean);
}

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/requests/${id}`);
  const request = await getMyRequest(id, user.id);
  if (!request) notFound();

  const isOpen = request.status === "OPEN";
  const status = describe(request);

  // เรียงใบที่ยังเลือกได้ก่อน ราคาต่ำไปสูง แล้วตามด้วยใบที่ถูกเลือกหรือไม่ถูกเลือก
  const quotes = [...request.quotes].sort((a, b) => {
    const rank = (q: QuoteDTO) => (q.status === "DECLINED" ? 2 : q.status === "ACCEPTED" ? 0 : 1);
    return rank(a) - rank(b) || a.price - b.price;
  });
  const comparable = quotes.filter((q) => q.status !== "DECLINED");
  const lowest = comparable.length > 0 ? Math.min(...comparable.map((q) => q.price)) : null;
  const compare = comparable.length > 1;

  return (
    <AppShell width="full">
      <PageHeader title={REQUEST_TYPES[request.type]} backHref="/orders" backLabel="งานของฉัน" />

      <Rise>
        <StatusLine
          title={status.title}
          detail={status.detail}
          tone={status.tone}
          steps={request.status === "CLOSED" ? undefined : FLOW}
          step={status.step}
        >
          {request.orderId ? (
            <LinkButton href={`/orders/${request.orderId}`} variant="gold" className="w-full sm:w-auto">
              ดูคำสั่งซื้อ
            </LinkButton>
          ) : null}
        </StatusLine>
      </Rise>

      <TwoColumn
        className="mt-8 lg:mt-10"
        asideOn="after"
        aside={
          <SidePanel title="คำขอของคุณ">
            <div className="flex flex-col gap-4">
              {request.photoUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {request.photoUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt="รูปที่แนบกับคำขอ"
                      className="aspect-square w-full rounded-lg object-cover ring-1 ring-foreground/6 ring-inset"
                    />
                  ))}
                </div>
              ) : null}
              <p className="text-base leading-relaxed whitespace-pre-line">{request.description}</p>
              <dl className="flex flex-col border-y border-border text-base">
                <div className="flex justify-between gap-6 border-b border-border py-3">
                  <dt className="shrink-0 text-sm text-muted-foreground">พื้นที่</dt>
                  <dd className="text-right">{AREAS[request.area]}</dd>
                </div>
                <div className="flex justify-between gap-6 border-b border-border py-3">
                  <dt className="shrink-0 text-sm text-muted-foreground">ที่อยู่</dt>
                  <dd className="min-w-0 text-right break-words whitespace-pre-line">{request.address}</dd>
                </div>
                <div className="flex justify-between gap-6 py-3">
                  <dt className="shrink-0 text-sm text-muted-foreground">ส่งเมื่อ</dt>
                  <dd className="numeric text-right">{formatShortDate(request.createdAt)}</dd>
                </div>
              </dl>
              {request.location ? (
                <ExpandableMap title="ดูหมุดที่คุณปักไว้" hint="ร้านที่รับงานจะเห็นหมุดนี้ ไม่แสดงให้คนอื่น" hasPin>
                  <MapView
                    markers={[{ ...request.location, tone: "customer", label: "ที่ตั้งศาล" }]}
                    height="14rem"
                    zoom={15}
                    ariaLabel="แผนที่หมุดที่ตั้งศาลของคำขอ"
                    description={`หมุดตามที่คุณปักไว้ ที่อยู่: ${request.address}`}
                  />
                </ExpandableMap>
              ) : null}
              {isOpen ? <CloseRequestButton requestId={request.id} /> : null}
            </div>
          </SidePanel>
        }
      >
        {quotes.length === 0 ? (
          <EmptyState art="lotus" title="ยังไม่มีใบเสนอราคา" />
        ) : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {quotes.map((quote) => (
              <li key={quote.id} className={cn(quotes.length === 1 && "lg:col-span-2")}>
                <QuoteCard
                  quote={quote}
                  canAccept={isOpen && quote.status === "SENT"}
                  recommended={isOpen && quote.status === "SENT" && quote.price === lowest}
                  compare={compare}
                  lowest={lowest}
                />
              </li>
            ))}
          </ul>
        )}
      </TwoColumn>
    </AppShell>
  );
}

function QuoteCard({
  quote,
  canAccept,
  recommended,
  compare,
  lowest,
}: {
  quote: QuoteDTO;
  canAccept: boolean;
  /** ใบที่ราคาต่ำสุดในบรรดาใบที่เลือกได้: ได้ปุ่มชาดและราคาสีชาด */
  recommended: boolean;
  compare: boolean;
  lowest: number | null;
}) {
  const { provider } = quote;
  const verified = provider.status === "VERIFIED";
  const declined = quote.status === "DECLINED";
  const lines = quote.note ? noteLines(quote.note) : [];
  const extra = compare && lowest !== null && !declined && quote.price > lowest ? quote.price - lowest : 0;

  return (
    <article className={cn("flex h-full flex-col gap-5 surface p-5", declined && "opacity-70")}>
      <div className="flex items-center gap-3">
        <Monogram name={provider.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-base leading-snug font-medium">{provider.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {verified ? <VerifiedPill className="h-6 px-2.5" /> : null}
            <Rating value={provider.rating} count={provider.reviewCount} size="sm" />
          </div>
        </div>
      </div>

      <div>
        <Price amount={quote.price} size="xl" emphasis={recommended} />
        <p className="mt-1 text-sm text-muted-foreground">
          {recommended && compare
            ? "ราคาต่ำสุด · "
            : extra > 0
              ? `สูงกว่าต่ำสุด ${formatBaht(extra)} · `
              : ""}
          มัดจำ {DEPOSIT_PCT}% <span className="numeric">{formatBaht(Math.round(quote.price * DEPOSIT_RATE))}</span>
        </p>
      </div>

      {lines.length > 1 ? (
        <ul className="flex flex-col gap-2 border-t border-border pt-4 text-base leading-relaxed">
          {lines.map((line) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/50" />
              <span className="min-w-0 break-words">{line}</span>
            </li>
          ))}
        </ul>
      ) : lines.length === 1 ? (
        <p className="border-t border-border pt-4 text-base leading-relaxed break-words">{lines[0]}</p>
      ) : null}

      {quote.status === "ACCEPTED" ? <TonePill tone="good">เลือกแล้ว</TonePill> : null}
      {declined ? <TonePill tone="neutral">ไม่ได้เลือก</TonePill> : null}

      <div className="mt-auto flex flex-col gap-1">
        {canAccept ? <AcceptQuoteButton quoteId={quote.id} variant={recommended ? "gold" : "outline"} /> : null}
        {verified ? (
          <Link
            href={`/shops/${provider.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-0.5 rounded-full text-base font-medium hover:bg-muted"
          >
            ดูโปรไฟล์ร้านและรีวิว
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
