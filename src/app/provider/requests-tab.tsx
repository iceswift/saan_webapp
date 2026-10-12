import { ChevronDown } from "lucide-react";
import { Chip, ChipRow } from "@/components/chip";
import { ExpandableMap } from "@/components/map/expandable-map";
import { MapView } from "@/components/map/map-view";
import { Notice } from "@/components/notice";
import { ListGroup } from "@/components/list-group";
import { Price } from "@/components/price";
import { TonePill } from "@/components/status-badge";
import { EmptyState, ThumbArt } from "@/components/visuals";
import { AREAS, REQUEST_TYPES } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import { distanceKm, formatDistance } from "@/lib/geo";
import type { ProviderRequest, ProviderSummary } from "@/lib/types";
import { REQUEST_TYPE_ART } from "./icon-map";
import { QuoteForm } from "./quote-form";

const QUOTE_STATUS = {
  SENT: { tone: "info", label: "รอลูกค้าเลือก" },
  ACCEPTED: { tone: "good", label: "ลูกค้าเลือกร้านคุณ" },
  DECLINED: { tone: "neutral", label: "ลูกค้าเลือกร้านอื่น" },
} as const;

export type RequestFilter = "all" | "todo" | "sent";

export function parseRequestFilter(raw: string | string[] | undefined): RequestFilter {
  return raw === "todo" || raw === "sent" ? raw : "all";
}

/** แท็บ "คำขอ": คำขอเปิดอยู่ในพื้นที่ของร้าน แต่ละแถวกดเปิดดูรายละเอียดและส่งใบเสนอราคาได้ในแถวเดียว */
export function RequestsTab({
  provider,
  requests,
  filter,
}: {
  provider: ProviderSummary;
  requests: ProviderRequest[];
  filter: RequestFilter;
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        art="garland"
        title="ยังไม่มีคำขอในพื้นที่ของคุณ"
        description="คำขอจากลูกค้าในพื้นที่ที่ร้านให้บริการจะแสดงที่นี่"
      />
    );
  }

  const verified = provider.status === "VERIFIED";
  const todo = requests.filter((r) => r.myQuote === null);
  const sent = requests.filter((r) => r.myQuote !== null);
  const shown = filter === "todo" ? todo : filter === "sent" ? sent : requests;

  return (
    <div className="mt-5 max-w-4xl lg:mt-8">
      {!verified ? (
        <Notice tone="amber" className="mb-5">
          ส่งใบเสนอราคาได้หลังร้านผ่านการตรวจสอบ
        </Notice>
      ) : null}

      <ChipRow label="กรองคำขอ">
        <Chip href="/provider?tab=requests" active={filter === "all"}>
          ทั้งหมด <span className="numeric">{requests.length}</span>
        </Chip>
        <Chip href="/provider?tab=requests&f=todo" active={filter === "todo"}>
          ยังไม่เสนอราคา <span className="numeric">{todo.length}</span>
        </Chip>
        <Chip href="/provider?tab=requests&f=sent" active={filter === "sent"}>
          เสนอราคาแล้ว <span className="numeric">{sent.length}</span>
        </Chip>
      </ChipRow>

      {shown.length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">
          {filter === "todo" ? "เสนอราคาครบทุกรายการแล้ว" : "ยังไม่ได้เสนอราคารายการไหน"}
        </p>
      ) : (
        <ListGroup className="mt-4" label="คำขอจากลูกค้า">
          {shown.map((request) => (
            <li key={request.id} className="min-w-0">
              <RequestRow request={request} verified={verified} provider={provider} />
            </li>
          ))}
        </ListGroup>
      )}
    </div>
  );
}

function RequestRow({
  request,
  verified,
  provider,
}: {
  request: ProviderRequest;
  verified: boolean;
  provider: ProviderSummary;
}) {
  const quote = request.myQuote;
  const away =
    request.location && provider.location ? distanceKm(provider.location, request.location) : null;
  return (
    <details className="group/req">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-4 py-3 transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
        <ThumbArt service={REQUEST_TYPE_ART[request.type]} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-snug font-medium">{REQUEST_TYPES[request.type]}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {AREAS[request.area]} · {formatShortDate(request.createdAt)}
          </span>
          <span className="line-clamp-1 block text-sm text-muted-foreground">{request.description}</span>
        </span>
        {quote ? (
          <span className="flex shrink-0 flex-col items-end gap-1">
            <Price amount={quote.price} size="sm" />
            <TonePill tone={QUOTE_STATUS[quote.status].tone}>{QUOTE_STATUS[quote.status].label}</TonePill>
          </span>
        ) : verified ? (
          <span className="inline-flex h-10 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground group-open/req:hidden">
            ส่งใบเสนอราคา
          </span>
        ) : null}
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open/req:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-border px-4 py-5 lg:px-6">
        <p className="text-base whitespace-pre-line">{request.description}</p>
        {request.address ? <p className="mt-2 text-base text-muted-foreground">{request.address}</p> : null}
        <p className="mt-2 text-sm text-muted-foreground">ลูกค้า {request.customerName}</p>
        {away !== null ? (
          <p className="mt-1 text-base">ห่างจากร้านคุณ{formatDistance(away)} (เส้นตรง ไม่ใช่ระยะทางถนน)</p>
        ) : null}
        {request.location ? (
          <ExpandableMap
            className="mt-4 max-w-md"
            title="ดูหมุดหน้างาน"
            hint="ตำแหน่งที่ลูกค้าปักไว้"
            hasPin
          >
            <MapView
              markers={[
                { ...request.location, tone: "customer", label: "ที่ตั้งศาล" },
                ...(provider.location
                  ? [
                      {
                        lat: Math.round(provider.location.lat * 1000) / 1000,
                        lng: Math.round(provider.location.lng * 1000) / 1000,
                        tone: "shop" as const,
                        label: provider.name,
                      },
                    ]
                  : []),
              ]}
              radiusKm={provider.location ? provider.serviceRadiusKm : null}
              height="14rem"
              ariaLabel="แผนที่หมุดหน้างานของคำขอ"
              description={`ที่อยู่: ${request.address}`}
            />
          </ExpandableMap>
        ) : null}

        {request.photoUrls.length > 0 ? (
          <ul className="mt-4 grid max-w-md grid-cols-3 gap-2.5">
            {request.photoUrls.map((url) => (
              <li key={url} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="รูปประกอบคำขอ" className="size-full object-cover" />
              </li>
            ))}
          </ul>
        ) : null}

        {verified ? (
          <div className="mt-5 max-w-md border-t border-border pt-5">
            <p className="mb-4 text-base font-medium">{quote ? "แก้ไขใบเสนอราคา" : "เสนอราคาให้ลูกค้า"}</p>
            <QuoteForm requestId={request.id} myQuote={quote} />
          </div>
        ) : null}
      </div>
    </details>
  );
}
