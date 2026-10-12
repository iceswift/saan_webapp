import type { Metadata } from "next";
import { ViewTransition } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Star } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ChipRow } from "@/components/chip";
import { LinkButton } from "@/components/link-button";
import { CardGrid } from "@/components/page-layout";
import { Price } from "@/components/price";
import { Rise } from "@/components/rise";
import { EmptyState, ShrineImage } from "@/components/visuals";
import {
  AREAS,
  AREA_CODES,
  PLACE_TYPES,
  PLACE_TYPE_CODES,
  SHRINE_KINDS,
  SHRINE_KIND_CODES,
} from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";
import { listProducts } from "@/server/queries";
import { SaveButton } from "@/app/products/saved-products";
import { firstValue, parseBudget, pickCode } from "../options";

export const metadata: Metadata = { title: "ศาลที่ตรงกับคำตอบของคุณ" };

export default async function ProductsPage({ searchParams }: PageProps<"/new/products">) {
  const sp = await searchParams;
  const place = pickCode(firstValue(sp.place), PLACE_TYPE_CODES);
  const area = pickCode(firstValue(sp.area), AREA_CODES);
  if (!place || !area) redirect("/new");

  const kind = pickCode(firstValue(sp.kind), SHRINE_KIND_CODES);
  const maxPrice = parseBudget(firstValue(sp.max));
  const products = await listProducts({ area, kind, maxPrice });

  const answerPills = [
    PLACE_TYPES[place],
    AREAS[area],
    kind ? SHRINE_KINDS[kind] : "ทุกประเภทศาล",
    maxPrice ? `ไม่เกิน ${formatBaht(maxPrice)}` : "ไม่จำกัดงบ",
  ];

  // ส่งคำตอบต่อไปหน้าศาล เพื่อให้หน้าศาลและหน้ายืนยันไม่ต้องถามซ้ำ
  const carry = new URLSearchParams({ place, area });
  if (kind) carry.set("kind", kind);
  if (maxPrice) carry.set("max", String(maxPrice));

  return (
    <AppShell width="full">
      <PageHeader
        title="ศาลที่ตรงกับคำตอบของคุณ"
        subtitle={products.length > 0 ? `พบ ${products.length} ชุดที่ร้านตรวจสอบแล้ว` : undefined}
        backHref="/new"
        backLabel="ปรับคำตอบ"
      />

      <Rise>
        <ChipRow label="คำตอบของคุณ" className="-mt-2 mb-6 lg:mt-0 lg:mb-8">
          {answerPills.map((label) => (
            <span
              key={label}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-muted px-4 text-sm font-medium whitespace-nowrap lg:text-base"
            >
              {label}
            </span>
          ))}
        </ChipRow>
      </Rise>

      {products.length === 0 ? (
        <EmptyState
          art="search"
          title="ยังไม่มีศาลที่ตรงกับเงื่อนไข"
          description="ลองเพิ่มงบ หรือเลือกประเภทศาลอื่น"
          action={
            <LinkButton href="/new" variant="outline">
              ปรับคำตอบ
            </LinkButton>
          }
        />
      ) : (
        <CardGrid cols="products">
          {products.map((product) => (
            <li key={product.id}>
              <ResultCard product={product} query={carry.toString()} />
            </li>
          ))}
        </CardGrid>
      )}
    </AppShell>
  );
}

/**
 * การ์ดผลลัพธ์: หน้าตาเดียวกับ ProductCard ส่วนกลางทุกอย่าง ต่างกันเพียงลิงก์ที่ส่งคำตอบต่อ (?area=&place=...)
 * (ProductCard ส่วนกลางยังไม่มี prop href จึงต้องมีตัวนี้ในเส้นทางนี้ ถ้ามี href แล้วให้เปลี่ยนไปใช้ตัวกลาง)
 */
function ResultCard({ product, query }: { product: ProductDTO; query: string }) {
  const { provider } = product;
  const verified = provider.status === "VERIFIED";
  const rated = provider.rating !== null && provider.reviewCount > 0;
  const area =
    provider.areas.length === 0
      ? null
      : provider.areas.length === 1
        ? AREAS[provider.areas[0]]
        : `${AREAS[provider.areas[0]]} +${provider.areas.length - 1}`;

  return (
    <div className="group/card relative h-full">
      <Link
        href={`/products/${product.id}?${query}`}
        className="flex h-full flex-col overflow-hidden surface transition-colors hover:bg-muted"
      >
        <ViewTransition name={`product-${product.id}`} share="morph-image" default="none">
          <ShrineImage
            src={product.imageUrl}
            alt={product.name}
            kind={product.kind}
            seed={product.id}
            flush
            className="aspect-4/3 w-full sm:aspect-square"
          />
        </ViewTransition>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3.5 lg:p-4">
          <span className="text-sm text-muted-foreground">{SHRINE_KINDS[product.kind]}</span>
          <span className="line-clamp-2 text-base leading-snug font-medium">{product.name}</span>
          <span className="sr-only">ร้าน {provider.name}</span>
          {area || rated ? (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
              {area ? (
                <span className="inline-flex items-center gap-1">
                  {verified ? (
                    <ShieldCheck
                      className="size-4 shrink-0 text-foreground"
                      strokeWidth={1.8}
                      aria-label="ร้านผ่านการตรวจสอบ"
                    />
                  ) : null}
                  {area}
                </span>
              ) : null}
              {rated ? (
                <span className="numeric inline-flex items-center gap-1">
                  <Star className="size-3.5 shrink-0 fill-marigold text-marigold" aria-hidden="true" />
                  {provider.rating?.toFixed(1)}
                  <span className="sr-only">จาก 5 ดาว</span>
                  <span aria-hidden="true">({provider.reviewCount})</span>
                </span>
              ) : null}
            </span>
          ) : null}
          <Price amount={product.price} size="md" className="mt-auto pt-2" />
        </span>
      </Link>
      <SaveButton
        productId={product.id}
        productName={product.name}
        overlay
        className="absolute top-3 right-3"
      />
    </div>
  );
}
