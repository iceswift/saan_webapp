// ส่วนแสดงผลของหน้ารายละเอียดคำสั่ง ไม่มี state จึงไม่ต้องเป็น client component
// ไฟล์นี้ไม่ import ข้อมูลฝั่งเซิร์ฟเวอร์ จึงใช้ร่วมกับ client component ได้
// v6: ส่วนต่าง ๆ เป็นรายการเรียบ ๆ คั่นด้วยเส้นบาง ไม่มีกล่องซ้อนกล่อง ไม่มีไอคอนในวงกลม

import { MapPin, Navigation, Phone, Star } from "lucide-react";
import { SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { PhotoThumbs } from "@/components/lightbox";
import { ExpandableMap } from "@/components/map/expandable-map";
import { MapView, type MapMarker } from "@/components/map/map-view";
import { Price } from "@/components/price";
import { buttonVariants } from "@/components/ui/button";
import { TonePill } from "@/components/status-badge";
import { AREAS, DEPOSIT_RATE, PAYMENT_METHODS, PAYMENT_STATUS, PLACE_TYPES, SHRINE_KINDS } from "@/lib/constants";
import { formatBaht, formatDateOnly, formatPhone, formatShortDate } from "@/lib/format";
import { mapsLink } from "@/lib/geo";
import type { OrderDetail, PaymentDTO, ReviewDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAR_NUMBERS = [1, 2, 3, 4, 5] as const;

export function ReviewView({ review }: { review: ReviewDTO }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1" role="img" aria-label={`ให้ ${review.rating} ดาว`}>
        {STAR_NUMBERS.map((n) => (
          <Star
            key={n}
            aria-hidden="true"
            className={cn("size-6", n <= review.rating ? "fill-marigold text-marigold" : "text-input")}
          />
        ))}
      </div>
      {review.comment ? <p className="text-base leading-relaxed">{review.comment}</p> : null}
      <PhotoThumbs urls={review.photoUrls} alt="รูปงานจริงจากลูกค้า" className="mt-1" />
      <p className="text-sm text-muted-foreground">รีวิวเมื่อ {formatShortDate(review.createdAt)}</p>
    </div>
  );
}

function paidFlags(order: OrderDetail) {
  const paidOf = (kind: PaymentDTO["kind"]) =>
    order.payments.some((p) => p.kind === kind && p.status === "PAID");
  return { depositPaid: paidOf("DEPOSIT"), balancePaid: paidOf("BALANCE") };
}

function MoneyRow({
  label,
  value,
  badge,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", strong ? "font-medium" : "text-muted-foreground")}>
        {label}
        {badge}
      </dt>
      <dd className="numeric shrink-0 font-medium">{value}</dd>
    </div>
  );
}

/** แถวมัดจำ ส่วนที่เหลือ และยอดที่ต้องจ่ายอีก (ใช้ทั้งในส่วนรายการและแผงข้างบนเดสก์ท็อป) */
export function MoneyRows({ order, withTotal = false }: { order: OrderDetail; withTotal?: boolean }) {
  const { depositPaid, balancePaid } = paidFlags(order);
  return (
    <dl className="flex flex-col gap-3 text-base">
      {withTotal ? (
        <div className="flex items-end justify-between gap-4">
          <dt className="font-medium">ยอดรวม</dt>
          <dd>
            <Price amount={order.total} size="lg" />
          </dd>
        </div>
      ) : null}
      <MoneyRow
        label={`มัดจำ ${Math.round(DEPOSIT_RATE * 100)}%`}
        value={formatBaht(order.deposit)}
        badge={depositPaid ? <TonePill tone="good">จ่ายแล้ว</TonePill> : null}
      />
      <MoneyRow
        label="ส่วนที่เหลือ"
        value={formatBaht(Math.max(order.total - order.deposit, 0))}
        badge={balancePaid ? <TonePill tone="good">จ่ายแล้ว</TonePill> : null}
      />
      {order.status !== "CANCELLED" && order.balance > 0 ? (
        <div className="border-t border-border pt-3">
          <MoneyRow label="ยอดที่ต้องจ่ายอีก" value={formatBaht(order.balance)} strong />
        </div>
      ) : null}
    </dl>
  );
}

/** รายการและยอดเงิน เป็นใบสรุปเรียบ ๆ ยอดทุกบรรทัดมาจากคำสั่งจริง */
export function OrderItems({ order, titleClassName }: { order: OrderDetail; titleClassName?: string }) {
  return (
    <section>
      <SectionTitle className={titleClassName}>รายการและยอดเงิน</SectionTitle>
      <ul className="flex flex-col gap-3 border-y border-border py-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 text-base">
            <span className="min-w-0">{item.name}</span>
            <span className="numeric shrink-0">{formatBaht(item.price)}</span>
          </li>
        ))}
        <li className="mt-1 flex items-end justify-between gap-4 border-t border-border pt-4">
          <span className="text-base font-medium">ยอดรวม</span>
          <Price amount={order.total} size="lg" />
        </li>
      </ul>
      <div className="mt-4 lg:hidden">
        <MoneyRows order={order} />
      </div>
    </section>
  );
}

/** ข้อมูลติดต่อร้านในแผงข้างบนเดสก์ท็อป */
export function ShopContact({ order }: { order: OrderDetail }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">ร้านที่รับงาน</p>
      <p className="text-base leading-snug font-medium">{order.provider.name}</p>
      <a
        href={`tel:${order.provider.phone}`}
        className="numeric -ml-2 inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Phone className="size-4 shrink-0" aria-hidden="true" />
        {formatPhone(order.provider.phone)}
      </a>
    </div>
  );
}

type DetailRowData = {
  label: string;
  content: React.ReactNode;
  /** ซ่อนบนเดสก์ท็อปเมื่อข้อมูลนี้อยู่ในแผงด้านข้างแล้ว */
  inPanel?: boolean;
  wide?: boolean;
};

export function OrderDetails({ order }: { order: OrderDetail }) {
  const rows: DetailRowData[] = [
    { label: "ร้าน", content: order.provider.name, inPanel: true },
    {
      label: "เบอร์ติดต่อร้าน",
      content: (
        <a
          href={`tel:${order.provider.phone}`}
          className="numeric inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {formatPhone(order.provider.phone)}
        </a>
      ),
      inPanel: true,
    },
    { label: "พื้นที่", content: AREAS[order.area] },
    { label: "ที่อยู่สำหรับตั้งศาล", content: order.address, wide: true },
  ];
  if (order.placeType) rows.push({ label: "ประเภทสถานที่", content: PLACE_TYPES[order.placeType] });
  if (order.shrineKind) rows.push({ label: "ประเภทศาล", content: SHRINE_KINDS[order.shrineKind] });
  if (order.scheduledAt === null && order.preferredDates.length > 0) {
    rows.push({
      label: "วันที่สะดวก",
      content: (
        <span className="flex flex-col">
          {order.preferredDates.map((date) => (
            <span key={date}>{formatDateOnly(date)}</span>
          ))}
        </span>
      ),
    });
  }
  if (order.note) rows.push({ label: "หมายเหตุ", content: order.note, wide: true });

  return (
    <section>
      <SectionTitle>รายละเอียด</SectionTitle>
      <dl className="border-y border-border lg:grid lg:grid-cols-2 lg:gap-x-10">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              // เดสก์ท็อป: คอลัมน์แคบให้ป้ายอยู่เหนือค่า (ไม่แบ่งสองช่องแล้วบีบค่าทีละตัวอักษร) แถวเต็มความกว้างใช้ป้ายซ้ายได้
              "flex items-baseline justify-between gap-6 border-b border-border py-3 last:border-b-0 lg:flex-col lg:items-stretch lg:justify-start lg:gap-1",
              row.wide && "lg:grid lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-baseline lg:gap-4",
              row.inPanel && "lg:hidden",
              row.wide && "lg:col-span-2",
            )}
          >
            <dt className="shrink-0 text-sm text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-right text-base break-words whitespace-pre-line lg:text-left">
              {row.content}
            </dd>
          </div>
        ))}
      </dl>
      <OrderMap order={order} />
    </section>
  );
}

/**
 * แผนที่ของงาน: หมุดที่ลูกค้าปักไว้ (สีชาด) + ที่ตั้งร้านโดยประมาณ (สีหมึก) + วงรัศมีบริการ
 * ความเป็นส่วนตัว: คำสั่งนี้เปิดดูได้เฉพาะลูกค้าเจ้าของงานและร้านที่รับงาน หมุดบ้านจึงไม่รั่วออกหน้าสาธารณะ
 * ร้านและผู้ดูแล (viewerIs ไม่ใช่ CUSTOMER) จะเห็นปุ่ม "นำทางไปหน้างาน" ไปยังหมุดงานด้วย
 * collapsible: ปุ่มนำทางอยู่ด้านบนเสมอ ส่วนแผนที่พับไว้ (ไม่โหลดจนกว่าจะเปิด) ใช้เมื่อหน้าแสดงส่วนเดียวกันสองชุดตามขนาดจอ
 */
export function OrderMap({ order, collapsible = false }: { order: OrderDetail; collapsible?: boolean }) {
  if (!order.location) return null;
  const shop = order.provider.location
    ? {
        lat: Math.round(order.provider.location.lat * 1000) / 1000,
        lng: Math.round(order.provider.location.lng * 1000) / 1000,
      }
    : null;
  const markers: MapMarker[] = [{ ...order.location, tone: "customer", label: "ที่ตั้งศาล" }];
  if (shop) markers.push({ ...shop, tone: "shop", label: order.provider.name });
  const map = (
    <MapView
      markers={markers}
      radiusKm={shop ? order.provider.serviceRadiusKm : null}
      height="16rem"
      ariaLabel="แผนที่ที่ตั้งศาลและที่ตั้งร้าน"
      description={`ที่ตั้งศาลตามที่ปักหมุดไว้ ที่อยู่: ${order.address}`}
    />
  );
  const navigate =
    order.viewerIs !== "CUSTOMER" ? (
      <a
        href={mapsLink(order.location)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full sm:w-auto")}
      >
        <Navigation />
        นำทางไปหน้างาน
      </a>
    ) : null;
  if (collapsible) {
    return (
      <div className="mt-5 flex flex-col gap-3">
        {navigate}
        <ExpandableMap title="ดูแผนที่หน้างาน" hint="หมุดที่ลูกค้าปักไว้และที่ตั้งร้านโดยประมาณ" hasPin>
          {map}
        </ExpandableMap>
      </div>
    );
  }
  return (
    <div className="mt-5">
      {map}
      {navigate ? <div className="mt-3">{navigate}</div> : null}
    </div>
  );
}

/** ลูกค้าไม่ได้ปักหมุด: เปิดที่อยู่ที่พิมพ์ไว้ในแผนที่ (ค้นหาตามข้อความ ไม่ใช่ตำแหน่งแน่นอน) */
export function OpenAddressLink({ address }: { address: string }) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">ลูกค้าไม่ได้ปักหมุด ใช้ที่อยู่ด้านบน</p>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full sm:w-auto")}
      >
        <MapPin />
        เปิดที่อยู่ในแผนที่
      </a>
    </div>
  );
}

export function OrderPayments({ payments }: { payments: PaymentDTO[] }) {
  if (payments.length === 0) return null;
  return (
    <section>
      <SectionTitle>การชำระเงิน</SectionTitle>
      <ListGroup bare label="การชำระเงิน">
        {payments.map((payment) => (
          <ListRow
            key={payment.id}
            title={payment.kind === "DEPOSIT" ? "มัดจำ" : "ส่วนที่เหลือ"}
            meta={`${PAYMENT_METHODS[payment.method]}${payment.paidAt ? ` · ${formatShortDate(payment.paidAt)}` : ""}`}
            className="px-0"
            trailing={
              <span className="flex flex-col items-end gap-1.5">
                <Price amount={payment.amount} size="md" />
                <TonePill
                  tone={
                    payment.status === "PAID"
                      ? "good"
                      : payment.status === "PENDING"
                        ? "wait"
                        : payment.status === "REFUNDED"
                          ? "info"
                          : "bad"
                  }
                >
                  {PAYMENT_STATUS[payment.status]}
                </TonePill>
              </span>
            }
          />
        ))}
      </ListGroup>
    </section>
  );
}
