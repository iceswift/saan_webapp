import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ExpandableMap } from "@/components/map/expandable-map";
import { MapView } from "@/components/map/map-view";
import { ShareActions } from "@/components/share-actions";
import { ArchMark } from "@/components/brand";
import { ListGroup } from "@/components/list-group";
import { CardGrid } from "@/components/page-layout";
import { ProductCard } from "@/components/product-card";
import { Rating } from "@/components/rating";
import { Reveal } from "@/components/reveal";
import { Rise } from "@/components/rise";
import { EmptyState, Monogram } from "@/components/visuals";
import {
  PackageRow,
  RatingBreakdown,
  ReviewItem,
  monogramName,
} from "@/app/shops/public-parts";
import { AREAS } from "@/lib/constants";
import { getPublicProvider } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/shops/[id]">): Promise<Metadata> {
  const { id } = await params;
  const shop = await getPublicProvider(id);
  if (!shop) return { title: "ไม่พบร้านนี้" };
  const { provider } = shop;
  const areas = provider.areas.map((code) => AREAS[code]).join(" · ");
  const title = provider.name;
  const description = [
    provider.description.trim().slice(0, 120),
    areas ? `ให้บริการ ${areas}` : "",
    provider.reviewCount > 0 && provider.rating !== null
      ? `คะแนน ${provider.rating.toFixed(1)} จาก ${provider.reviewCount} รีวิว`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  // ใช้รูปสินค้าจริงของร้านเป็นรูปแชร์ ถ้ามี (ไม่ใช้รูปวาดประกอบ)
  const photo = shop.products.find((p) => p.imageUrl)?.imageUrl;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", ...(photo ? { images: [photo] } : {}) },
    twitter: { card: photo ? "summary_large_image" : "summary", title, description, ...(photo ? { images: [photo] } : {}) },
  };
}

/** แถบปกร้าน: พื้นเบจ มีซุ้มประตูศาลจาง ๆ เรียงเป็นลวดลาย (ใช้สีจากโทเคนทั้งหมด) */
function CoverBand() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-28 items-end justify-around overflow-hidden rounded-2xl bg-muted px-4 text-foreground sm:h-32 lg:h-44"
    >
      {[
        "size-14 translate-y-3",
        "size-20 translate-y-5 max-sm:hidden",
        "size-16 translate-y-2",
        "size-24 translate-y-6",
        "size-14 translate-y-3 max-sm:hidden",
        "size-20 translate-y-4",
        "size-16 translate-y-2 max-lg:hidden",
        "size-24 translate-y-6 max-lg:hidden",
      ].map((cls, i) => (
        <span key={i} className="opacity-25">
          <ArchMark className={cls} />
        </span>
      ))}
    </div>
  );
}

export default async function ShopPage({ params }: PageProps<"/shops/[id]">) {
  const { id } = await params;
  const shop = await getPublicProvider(id);
  if (!shop) notFound();

  const { provider } = shop;
  const verified = provider.status === "VERIFIED";
  const hasReviews = provider.reviewCount > 0 && provider.rating !== null;
  // ที่ตั้งร้านแสดงสาธารณะเป็นค่าโดยประมาณ (ปัด 3 ตำแหน่ง ≈ 100 เมตร)
  const shopPoint = provider.location
    ? {
        lat: Math.round(provider.location.lat * 1000) / 1000,
        lng: Math.round(provider.location.lng * 1000) / 1000,
      }
    : null;

  return (
    <AppShell width="full">
      <PageHeader title={provider.name} backHref="/browse" backLabel="เลือกดูศาล" />

      <Rise>
        <CoverBand />
        <div className="-mt-9 flex flex-col gap-4 px-4 lg:flex-row lg:items-end lg:gap-6 lg:px-8">
          <Monogram
            name={monogramName(provider.name)}
            size="lg"
            className="border-4 border-background"
          />
          <div className="flex min-w-0 flex-col gap-1.5 lg:pb-2">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
              {verified ? (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  ตรวจสอบแล้ว
                </span>
              ) : null}
              {hasReviews ? (
                <Rating value={provider.rating} count={provider.reviewCount} />
              ) : (
                <span className="text-muted-foreground">ยังไม่มีรีวิว</span>
              )}
              {shop.completedOrders > 0 ? (
                <span className="numeric text-muted-foreground">
                  งานที่เสร็จ {shop.completedOrders}
                </span>
              ) : null}
            </p>
            {provider.areas.length > 0 ? (
              <p className="text-base text-muted-foreground">
                ให้บริการ {provider.areas.map((code) => AREAS[code]).join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      </Rise>

      <Rise i={1}>
        <ShareActions title={`${provider.name} ร้านศาลพระภูมิบน Saan`} className="mt-5 px-4 lg:px-8" />
      </Rise>

      {provider.description ? (
        <Rise i={1}>
          <p className="mt-6 max-w-3xl text-base leading-relaxed whitespace-pre-line">
            {provider.description}
          </p>
        </Rise>
      ) : null}

      {shopPoint ? (
        <section className="mt-6 max-w-3xl">
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
            <p className="numeric mt-3 px-1 text-base">
              {provider.serviceRadiusKm
                ? `รับงานในรัศมี ${provider.serviceRadiusKm} กม.`
                : "ร้านไม่จำกัดรัศมีรับงาน"}
            </p>
          </ExpandableMap>
        </section>
      ) : null}

      <section>
        <SectionTitle>ศาลที่ขาย</SectionTitle>
        {shop.products.length === 0 ? (
          <p className="text-base text-muted-foreground">ร้านนี้ยังไม่มีศาลที่เปิดขาย</p>
        ) : (
          <CardGrid cols="products">
            {shop.products.map((product, index) => (
              <Reveal as="li" key={product.id} i={index % 4}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </CardGrid>
        )}
      </section>

      {shop.packages.length > 0 ? (
        <section className="max-w-3xl">
          <SectionTitle>บริการเสริม</SectionTitle>
          <ListGroup>
            {shop.packages.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} />
            ))}
          </ListGroup>
        </section>
      ) : null}

      <section className="max-w-3xl">
        <SectionTitle>รีวิว</SectionTitle>
        {shop.reviews.length === 0 ? (
          <EmptyState
            art="lotus"
            title="ยังไม่มีรีวิว"
            description="รีวิวจะแสดงที่นี่เมื่อลูกค้าตรวจรับงานและให้คะแนน"
          />
        ) : (
          <>
            <RatingBreakdown
              reviews={shop.reviews}
              average={provider.rating}
              total={provider.reviewCount}
            />
            {provider.reviewCount > shop.reviews.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                แถบสัดส่วนคิดจากรีวิวล่าสุด {shop.reviews.length} รายการ
              </p>
            ) : null}
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {shop.reviews.map((review, index) => (
                <ReviewItem key={`${review.createdAt}-${index}`} review={review} />
              ))}
            </ul>
          </>
        )}
      </section>
    </AppShell>
  );
}
