import type { Metadata } from "next";
import { ViewTransition } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { SidePanel, TwoColumn } from "@/components/page-layout";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { Rise } from "@/components/rise";
import { Stepper } from "@/components/stepper";
import { TrustNote } from "@/components/trust-note";
import { ExpandableMap } from "@/components/map/expandable-map";
import { MapView } from "@/components/map/map-view";
import { Monogram, ShrineImage } from "@/components/visuals";
import { Reveal } from "@/components/reveal";
import { ImageRail } from "@/components/image-rail";
import { ProductCard } from "@/components/product-card";
import { ORDER_FLOW_STEPS } from "@/app/orders/display";
import { firstValue, pickCode } from "@/app/new/options";
import { PackageRow, RatingBreakdown, ReviewItem, monogramName } from "@/app/shops/public-parts";
import { AREAS, AREA_CODES, DEPOSIT_RATE, SHRINE_KINDS } from "@/lib/constants";
import { browseReturn } from "@/lib/browse-return";
import { formatBaht } from "@/lib/format";
import { distanceKm, formatDistance, isInThailand } from "@/lib/geo";
import { getProduct, getPublicProvider } from "@/server/queries";
import { AreaRow, OrderCta, checkoutHref, type OrderParams } from "./order-panel";
import { PriceBar } from "./price-bar";
import { ProductActions } from "./product-actions";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "ไม่พบศาลนี้" };
  const title = product.name;
  const description = `${SHRINE_KINDS[product.kind]} จากร้าน ${product.provider.name} ราคา ${formatBaht(product.price)}${
    product.description ? ` · ${product.description.trim().slice(0, 100)}` : ""
  }`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", ...(product.imageUrl ? { images: [product.imageUrl] } : {}) },
    twitter: {
      card: product.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const product = await getProduct(id);
  if (!product) notFound();

  const { provider } = product;
  const shop = await getPublicProvider(provider.id);
  const allReviews = shop?.reviews ?? [];
  const reviews = allReviews.slice(0, 3);
  // ดีไซน์อื่นของร้านเดียวกัน (เฉพาะที่เปิดขายอยู่ ไม่รวมศาลนี้) สูงสุด 4 ใบ
  const moreFromShop = (shop?.products ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  // รูปจริงของศาล: ตอนนี้มีรูปเดียว (imageUrl) ไม่มี = ภาพวาดประกอบ ไม่ปลอมรูปเพิ่ม
  const images = product.imageUrl ? [product.imageUrl] : [];

  // คำตอบจากตัวช่วย /new ที่ส่งต่อมาทาง URL ใช้เฉพาะพื้นที่ที่ร้านให้บริการจริง
  const areaParam = pickCode(firstValue(sp.area), AREA_CODES);
  const returnToBrowse = browseReturn(firstValue(sp.from));
  const orderParams: OrderParams = {
    from: returnToBrowse,
    area: areaParam && provider.areas.includes(areaParam) ? areaParam : undefined,
    place: firstValue(sp.place),
    kind: firstValue(sp.kind),
    max: firstValue(sp.max),
  };

  // ระยะจากตำแหน่งของลูกค้า (?near=lat,lng ปัดแล้วจากหน้าเลือกดูศาล)
  const nearRaw = firstValue(sp.near);
  const nearMatch = nearRaw && /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(nearRaw) ? nearRaw.split(",").map(Number) : null;
  const near = nearMatch && isInThailand({ lat: nearMatch[0], lng: nearMatch[1] }) ? { lat: nearMatch[0], lng: nearMatch[1] } : null;
  const distance = near && provider.location ? distanceKm(provider.location, near) : null;
  const outOfRadius =
    distance !== null && provider.serviceRadiusKm !== null && distance > provider.serviceRadiusKm;
  // ตำแหน่งร้านที่แสดงต้องเป็นค่าโดยประมาณ (ปัด 3 ตำแหน่ง ≈ 100 เมตร)
  const nearParam = near ? `${near.lat.toFixed(2)},${near.lng.toFixed(2)}` : undefined;
  const shopPoint = provider.location
    ? {
        lat: Math.round(provider.location.lat * 1000) / 1000,
        lng: Math.round(provider.location.lng * 1000) / 1000,
      }
    : null;

  return (
    <AppShell
      width="full"
      desktopFooter="hide"
      footer={
        <OrderCta
          productId={product.id}
          areas={provider.areas}
          params={orderParams}
          price={product.price}
          className="w-full"
        />
      }
    >
      <PageHeader title={product.name} backHref={returnToBrowse ?? "/browse"} backLabel={returnToBrowse ? "กลับไปผลการค้นหา" : "เลือกดูศาล"} />

      <TwoColumn
        asideOn="hide"
        aside={
          <SidePanel>
            <Price amount={product.price} size="xl" emphasis />
            <p className="mt-1 text-sm text-muted-foreground">ค่าศาล ยังไม่รวมพิธีและบริการเสริม</p>
            <div className="mt-5 border-t border-border pt-2">
              <AreaRow productId={product.id} areas={provider.areas} params={orderParams} />
            </div>
            <div id="product-order-cta" className="mt-4">
              <OrderCta
                productId={product.id}
                areas={provider.areas}
                params={orderParams}
                price={product.price}
                className="w-full"
              />
            </div>
            <TrustNote items={["deposit", "cancel"]} className="mt-5" />
          </SidePanel>
        }
      >
        <Rise>
          <div className="-mx-5 sm:-mx-8 lg:mx-0">
            <ImageRail
              images={images}
              alt={product.name}
              transitionName={`product-${product.id}`}
              className="aspect-4/3 w-full [--arch-r:7rem] lg:aspect-[16/10] lg:rounded-b-lg lg:[--arch-r:12rem]"
              fallback={
                <ShrineImage
                  src={null}
                  alt={product.name}
                  kind={product.kind}
                  seed={product.id}
                  arch
                  flush
                  showCaption
                  className="size-full"
                />
              }
            />
          </div>
        </Rise>

        {/* กลุ่มปุ่มเดียวใต้รูป: บันทึก · แชร์ · LINE · ดูตำแหน่งร้าน */}
        <Rise i={1}>
          <ProductActions
            productId={product.id}
            productName={product.name}
            shareTitle={`${product.name} จากร้าน ${provider.name}`}
            hasMap={Boolean(shopPoint)}
            className="mt-4"
          />
        </Rise>

        {/* มือถือ: ราคา พื้นที่ และคำมั่นอยู่ใต้รูป (เดสก์ท็อปอยู่ในแผงด้านข้าง) */}
        <Rise i={2}>
          <div className="mt-6 flex flex-col gap-4 lg:hidden">
            <div>
              <Price amount={product.price} size="xl" emphasis />
              <p className="mt-1 text-sm text-muted-foreground">ค่าศาล ยังไม่รวมพิธีและบริการเสริม</p>
            </div>
            <div className="border-y border-border">
              <AreaRow productId={product.id} areas={provider.areas} params={orderParams} />
            </div>
            <TrustNote items={["deposit", "cancel"]} />
          </div>
        </Rise>

        <nav aria-label="ข้อมูลสินค้า" className="mt-6 flex flex-wrap gap-2 border-y border-border py-3">
          {[
            ...(product.description ? [["product-description", "รายละเอียดศาล"]] : []),
            ["product-cost", "ราคาและสิ่งที่ควรรู้"],
            ...(product.packages.length ? [["product-extras", "บริการเสริม"]] : []),
            ["product-shop", "ร้านผู้ให้บริการ"],
            ...(reviews.length ? [["product-reviews", "รีวิวร้าน"]] : []),
          ].map(([id, label]) => <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">{label}</a>)}
        </nav>

        <section id="product-cost" className="mt-6 scroll-mt-[calc(var(--site-header-h)+1rem)]">
          <SectionTitle>ราคาและสิ่งที่ควรรู้</SectionTitle>
          <ListGroup bare>
            <ListRow title="ค่าตัวศาล" meta="ราคานี้ยังไม่รวมพิธีและบริการเสริม" trailing={<Price amount={product.price} />} />
            <ListRow title="บริการเสริมเลือกได้" meta={product.packages.length ? "ดูรายการและราคาแยกด้านล่าง แล้วเลือกในขั้นตอนจอง" : "ร้านนี้ยังไม่มีรายการบริการเสริมให้เลือกในระบบ"} trailing={null} />
            <ListRow title="ยืนยันรายละเอียดก่อนสั่ง" meta="สอบถามขนาด วัสดุ สิ่งที่รวมในราคา และค่าเดินทางหรือขนส่งกับร้าน" trailing={null} />
          </ListGroup>
        </section>

        <Rise i={3}>
          <dl className="mt-6 divide-y divide-border border-y border-border lg:mt-8">
            {[
              { label: "ประเภทศาล", value: SHRINE_KINDS[product.kind] },
              {
                label: "พื้นที่บริการ",
                value:
                  provider.areas.length > 0
                    ? provider.areas.map((code) => AREAS[code]).join(" · ")
                    : "ยังไม่ระบุ",
              },
              { label: "มัดจำ", value: `${Math.round(DEPOSIT_RATE * 100)}% ของยอดรวม` },
              ...(distance !== null
                ? [
                    {
                      label: "ระยะจากคุณ",
                      value: outOfRadius
                        ? `ห่าง${formatDistance(distance)} (นอกรัศมีบริการ)`
                        : `ห่าง${formatDistance(distance)}`,
                    },
                  ]
                : []),
            ].map((fact) => (
              <div
                key={fact.label}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-5 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <dt className="text-base text-muted-foreground">{fact.label}</dt>
                <dd className="text-base leading-relaxed font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Rise>

        {product.description ? (
          <section id="product-description" className="scroll-mt-[calc(var(--site-header-h)+1rem)]"><Reveal>
            <SectionTitle>เกี่ยวกับศาลนี้</SectionTitle>
            <p className="max-w-3xl text-base leading-relaxed whitespace-pre-line">{product.description}</p>
          </Reveal></section>
        ) : null}

        <section id="product-shop" className="scroll-mt-[calc(var(--site-header-h)+1rem)]"><Reveal>
          <SectionTitle>ร้านผู้ให้บริการ</SectionTitle>
          <ListGroup bare>
            <ListRow
              href={`/shops/${provider.id}`}
              thumb={
                <ViewTransition name={`shop-${provider.id}`} share="morph-mark" default="none">
                  <Monogram name={monogramName(provider.name)} size="md" />
                </ViewTransition>
              }
              title={provider.name}
              meta={
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    ตรวจสอบแล้ว
                  </span>
                  {provider.reviewCount > 0 ? (
                    <Rating value={provider.rating} count={provider.reviewCount} size="sm" />
                  ) : null}
                </span>
              }
            />
          </ListGroup>
        </Reveal></section>

        {shopPoint ? (
          <section id="shop-map" className="mt-3 scroll-mt-[calc(var(--site-header-h)+1rem)]">
            <ExpandableMap title="ดูตำแหน่งร้าน" hint="ตำแหน่งโดยประมาณและพื้นที่ที่ร้านรับงาน">
              <MapView
                markers={[{ ...shopPoint, tone: "shop", label: provider.name }]}
                radiusKm={provider.serviceRadiusKm}
                height="16rem"
                ariaLabel={`แผนที่ตำแหน่งโดยประมาณของ ${provider.name}`}
                description={
                  provider.serviceRadiusKm
                    ? `ร้านรับงานในรัศมี ${provider.serviceRadiusKm} กิโลเมตรจากที่ตั้งร้าน`
                    : undefined
                }
              />
            </ExpandableMap>
          </section>
        ) : null}

        {product.packages.length > 0 ? (
          <section id="product-extras" className="scroll-mt-[calc(var(--site-header-h)+1rem)]"><Reveal>
            <SectionTitle description="เลือกเพิ่มเติมได้ในขั้นตอนสั่งซื้อ">บริการเสริม</SectionTitle>
            <ListGroup bare>
              {product.packages.map((pkg) => (
                <PackageRow key={pkg.id} pkg={pkg} />
              ))}
            </ListGroup>
          </Reveal></section>
        ) : null}

        {reviews.length > 0 ? (
          <section id="product-reviews" className="scroll-mt-[calc(var(--site-header-h)+1rem)]"><Reveal>
            <SectionTitle
              action={
                <Link
                  href={`/shops/${provider.id}`}
                  className="inline-flex min-h-11 items-center text-base font-medium underline underline-offset-4"
                >
                  ดูทั้งหมด
                </Link>
              }
            >
              รีวิวร้าน
            </SectionTitle>
            <RatingBreakdown
              reviews={allReviews}
              average={provider.rating}
              total={provider.reviewCount}
            />
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {reviews.map((review, index) => (
                <ReviewItem key={`${review.createdAt}-${index}`} review={review} />
              ))}
            </ul>
          </Reveal></section>
        ) : null}

        <Reveal className="mt-8 border-y border-border lg:mt-10">
          <details className="group/flow">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-medium [&::-webkit-details-marker]:hidden">
              หลังสั่งซื้อมีขั้นตอนอะไรบ้าง
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--dur-base) ease-soft group-open/flow:rotate-180"
              />
            </summary>
            <div className="pt-2 pb-5">
              <Stepper steps={[...ORDER_FLOW_STEPS]} current={0} orientation="vertical" info />
            </div>
          </details>
        </Reveal>

        {moreFromShop.length > 0 ? (
          <Reveal as="section">
            <SectionTitle>ดีไซน์อื่นจากร้านนี้</SectionTitle>
            <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:gap-4 lg:px-0">
              {moreFromShop.map((p) => (
                <li key={p.id} className="w-44 shrink-0 snap-start lg:w-56">
                  <ProductCard product={p} near={nearParam} />
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </TwoColumn>

      <PriceBar
        targetId="product-order-cta"
        name={product.name}
        kind={product.kind}
        imageUrl={product.imageUrl}
        price={product.price}
        href={checkoutHref(product.id, provider.areas, orderParams)}
      />
    </AppShell>
  );
}
