import type { Metadata } from "next";
import { ViewTransition } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { SidePanel, TwoColumn } from "@/components/page-layout";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { Rise } from "@/components/rise";
import { Stepper } from "@/components/stepper";
import { TrustNote } from "@/components/trust-note";
import { Monogram, ShrineImage } from "@/components/visuals";
import { Reveal } from "@/components/reveal";
import { ORDER_FLOW_STEPS } from "@/app/orders/display";
import { firstValue, pickCode } from "@/app/new/options";
import { PackageRow, RatingBreakdown, ReviewItem, monogramName } from "@/app/shops/public-parts";
import { AREAS, AREA_CODES, DEPOSIT_RATE, SHRINE_KINDS } from "@/lib/constants";
import { getProduct, getPublicProvider } from "@/server/queries";
import { AreaRow, OrderCta, type OrderParams } from "./order-panel";
import { SaveButton, ShareButton } from "../saved-products";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? product.name : "ไม่พบศาลนี้" };
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

  // คำตอบจากตัวช่วย /new ที่ส่งต่อมาทาง URL ใช้เฉพาะพื้นที่ที่ร้านให้บริการจริง
  const areaParam = pickCode(firstValue(sp.area), AREA_CODES);
  const orderParams: OrderParams = {
    area: areaParam && provider.areas.includes(areaParam) ? areaParam : undefined,
    place: firstValue(sp.place),
    kind: firstValue(sp.kind),
    max: firstValue(sp.max),
  };

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
      <PageHeader title={product.name} backHref="/browse" backLabel="เลือกดูศาล" />

      <TwoColumn
        asideOn="hide"
        aside={
          <SidePanel>
            <Price amount={product.price} size="xl" emphasis />
            <p className="mt-1 text-sm text-muted-foreground">ค่าศาล ยังไม่รวมพิธีและบริการเสริม</p>
            <div className="mt-5 border-t border-border pt-2">
              <AreaRow productId={product.id} areas={provider.areas} params={orderParams} />
            </div>
            <OrderCta
              productId={product.id}
              areas={provider.areas}
              params={orderParams}
              price={product.price}
              className="mt-4 w-full"
            />
            <TrustNote items={["deposit", "cancel"]} className="mt-5" />
          </SidePanel>
        }
      >
        <Rise>
          <div className="relative -mx-5 sm:-mx-8 lg:mx-0">
            <ViewTransition name={`product-${product.id}`} share="morph-image" default="none">
              <ShrineImage
                src={product.imageUrl}
                alt={product.name}
                kind={product.kind}
                seed={product.id}
                arch
                flush
                showCaption
                className="aspect-4/3 w-full [--arch-r:7rem] lg:aspect-[16/10] lg:rounded-b-lg lg:[--arch-r:12rem]"
              />
            </ViewTransition>
            <div className="absolute top-3 right-5 flex gap-2 sm:right-8 lg:right-3">
              <ShareButton title={product.name} overlay />
              <SaveButton productId={product.id} productName={product.name} overlay />
            </div>
          </div>
        </Rise>

        {/* มือถือ: ราคา พื้นที่ และคำมั่นอยู่ใต้รูป (เดสก์ท็อปอยู่ในแผงด้านข้าง) */}
        <Rise i={1}>
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

        <Rise i={2}>
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
            ].map((fact) => (
              <div key={fact.label} className="flex items-baseline justify-between gap-6 py-3.5">
                <dt className="text-base text-muted-foreground">{fact.label}</dt>
                <dd className="text-right text-base leading-snug font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Rise>

        {product.description ? (
          <Reveal as="section">
            <SectionTitle>เกี่ยวกับศาลนี้</SectionTitle>
            <p className="max-w-3xl text-base leading-relaxed whitespace-pre-line">{product.description}</p>
          </Reveal>
        ) : null}

        <section>
          <SectionTitle>หลังสั่งแล้วเกิดอะไรขึ้น</SectionTitle>
          <Stepper steps={[...ORDER_FLOW_STEPS]} current={0} orientation="vertical" info />
        </section>

        <section>
          <SectionTitle>ร้านที่ขายศาลนี้</SectionTitle>
          <ListGroup>
            <ListRow
              href={`/shops/${provider.id}`}
              thumb={<Monogram name={monogramName(provider.name)} size="md" />}
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
        </section>

        {product.packages.length > 0 ? (
          <section>
            <SectionTitle>บริการเสริมจากร้านนี้</SectionTitle>
            <ListGroup>
              {product.packages.map((pkg) => (
                <PackageRow key={pkg.id} pkg={pkg} />
              ))}
            </ListGroup>
          </section>
        ) : null}

        {reviews.length > 0 ? (
          <section>
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
          </section>
        ) : null}
      </TwoColumn>
    </AppShell>
  );
}
