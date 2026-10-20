import type { Metadata } from "next";
import Link from "next/link";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BottomSheet, BottomSheetClose } from "@/components/bottom-sheet";
import { Chip, ChipRow, chipClass } from "@/components/chip";
import { MobileSearch } from "@/components/header-search";
import { LinkButton } from "@/components/link-button";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { CardGrid, TwoColumn } from "@/components/page-layout";
import { Rise } from "@/components/rise";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/visuals";
import { AREAS, AREA_CODES, SHRINE_KINDS, SHRINE_KIND_CODES } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import { isInThailand } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { firstValue, pickCode } from "@/app/new/options";
import { SavedRow } from "@/app/products/saved-products";
import { listProducts } from "@/server/queries";
import { BudgetForm } from "./budget-form";
import { NearMe } from "./near-me";

export const metadata: Metadata = { title: "เลือกดูศาล" };

const SORT_CODES = ["price_asc", "price_desc", "newest", "nearest"] as const;
const SORT_OPTIONS: { value: Exclude<(typeof SORT_CODES)[number], "nearest">; label: string }[] = [
  { value: "price_asc", label: "ราคาต่ำไปสูง" },
  { value: "price_desc", label: "ราคาสูงไปต่ำ" },
  { value: "newest", label: "มาใหม่" },
];

/** ตัวเลือกงบสูงสุดในแผ่นตัวกรอง (ค่าอื่นที่มากับ URL ยังใช้ได้ เพียงไม่มีปุ่มเลือก) */
const MAX_OPTIONS = [5000, 10000, 20000, 50000];

type Filters = {
  q?: string;
  kind?: string;
  area?: string;
  max?: number;
  sort?: string;
  /** "lat,lng" ปัดแล้ว */
  near?: string;
};

/** ?near=13.75,100.50 -> พิกัด (ต้องอยู่ในประเทศไทย ปัดเหลือ 2 ตำแหน่ง) หรือ undefined */
function parseNear(value: string | undefined): { lat: number; lng: number } | undefined {
  if (!value || !/^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(value)) return undefined;
  const [lat, lng] = value.split(",").map((n) => Math.round(Number(n) * 100) / 100);
  return isInThailand({ lat, lng }) ? { lat, lng } : undefined;
}

/** งบต้องเป็นจำนวนเต็มบวก ค่าอื่นถูกทิ้ง */
function parseMax(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** ลิงก์ค้นหาที่คงตัวกรองอื่นไว้ */
function browseHref(filters: Filters): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.kind) sp.set("kind", filters.kind);
  if (filters.area) sp.set("area", filters.area);
  if (filters.max) sp.set("max", String(filters.max));
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.near) sp.set("near", filters.near);
  const query = sp.toString();
  return query ? `/browse?${query}` : "/browse";
}

type FilterOption = { label: string; href: string; active: boolean };

/** กลุ่มตัวกรองแนวตั้งในแผงตัวกรองด้านซ้ายของเดสก์ท็อป (มือถือใช้ชิปประเภทศาล + แผ่น "ตัวกรอง") */
function FilterGroup({
  label,
  options,
  className,
}: {
  label: string;
  options: FilterOption[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-base font-medium">{label}</p>
      <ul aria-label={label} className="flex flex-col gap-0.5">
        {options.map((o) => (
          <li key={o.label}>
            <Link
              href={o.href}
              aria-current={o.active ? "true" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-full px-3 py-1.5 text-base transition-colors duration-[var(--dur-fast)]",
                o.active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="min-w-0 flex-1">{o.label}</span>
              {o.active ? <Check className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** หัวข้อกลุ่มในแผ่นตัวกรอง + ชิปเรียงหลายบรรทัด (ชิปเป็นลิงก์ กดแล้วผลลัพธ์ด้านหลังเปลี่ยนทันที) */
function SheetGroup({
  label,
  options,
  index,
}: {
  label: string;
  options: FilterOption[];
  index: number;
}) {
  return (
    <div style={{ "--i": index } as React.CSSProperties}>
      <p className="mb-2 text-base font-medium">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.label} href={o.href} active={o.active}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const sp = await searchParams;
  const q = firstValue(sp.q)?.trim().slice(0, 100) || undefined;
  const kind = pickCode(firstValue(sp.kind), SHRINE_KIND_CODES);
  const area = pickCode(firstValue(sp.area), AREA_CODES);
  const max = parseMax(firstValue(sp.max));
  const near = parseNear(firstValue(sp.near));
  const nearParam = near ? `${near.lat.toFixed(2)},${near.lng.toFixed(2)}` : undefined;
  // "ใกล้สุด" ใช้ได้เมื่อมีตำแหน่งเท่านั้น
  const sortRaw = pickCode(firstValue(sp.sort), SORT_CODES);
  const sort = sortRaw === "nearest" && !near ? undefined : sortRaw;

  const [products, everything] = await Promise.all([
    listProducts({ q, kind, area, maxPrice: max, sort, ...(near ? { near } : {}) }),
    listProducts({ sort: "newest" }),
  ]);
  const filters: Filters = { q, kind, area, max, sort, near: nearParam };
  const browseQuery = browseHref(filters).split("?")[1] ?? "";
  const activeSort = sort ?? (near ? "nearest" : "price_asc");
  const hasFilter = Boolean(q || kind || area || max || near);

  const kindOptions: FilterOption[] = [
    { label: "ทั้งหมด", href: browseHref({ ...filters, kind: undefined }), active: kind === undefined },
    ...SHRINE_KIND_CODES.map((code) => ({
      label: SHRINE_KINDS[code],
      href: browseHref({ ...filters, kind: code }),
      active: kind === code,
    })),
  ];
  const areaOptions: FilterOption[] = [
    { label: "ทุกพื้นที่", href: browseHref({ ...filters, area: undefined }), active: area === undefined },
    ...AREA_CODES.map((code) => ({
      label: AREAS[code],
      href: browseHref({ ...filters, area: code }),
      active: area === code,
    })),
  ];
  const sortOptions: FilterOption[] = (
    near ? [{ value: "nearest" as const, label: "ใกล้สุด" }, ...SORT_OPTIONS] : SORT_OPTIONS
  ).map((option) => ({
    label: option.label,
    href: browseHref({ ...filters, sort: option.value }),
    active: activeSort === option.value,
  }));

  const maxOptions: FilterOption[] = [
    { label: "ทุกราคา", href: browseHref({ ...filters, max: undefined }), active: max === undefined },
    ...MAX_OPTIONS.map((value) => ({
      label: `ไม่เกิน ${formatBaht(value)}`,
      href: browseHref({ ...filters, max: value }),
      active: max === value,
    })),
  ];
  // จำนวนตัวกรองในแผ่น (พื้นที่ งบ เรียงลำดับที่ไม่ใช่ค่าเริ่มต้น) แสดงเป็นเลขบนปุ่ม "ตัวกรอง"
  const sheetCount = (area ? 1 : 0) + (max ? 1 : 0) + (near ? 1 : 0) + (sort && sort !== "price_asc" && sort !== "nearest" ? 1 : 0);

  // ตัวกรองที่ใช้อยู่ (แสดงเป็นป้ายที่กดเอาออกได้ เฉพาะเดสก์ท็อป)
  const activeFilters: { label: string; href: string }[] = [
    ...(q ? [{ label: `“${q}”`, href: browseHref({ ...filters, q: undefined }) }] : []),
    ...(kind ? [{ label: SHRINE_KINDS[kind], href: browseHref({ ...filters, kind: undefined }) }] : []),
    ...(area ? [{ label: AREAS[area], href: browseHref({ ...filters, area: undefined }) }] : []),
    ...(max
      ? [{ label: `ไม่เกิน ${formatBaht(max)}`, href: browseHref({ ...filters, max: undefined }) }]
      : []),
    ...(near
      ? [
          {
            label: "ใกล้ฉัน",
            href: browseHref({
              ...filters,
              near: undefined,
              sort: sort === "nearest" ? undefined : sort,
            }),
          },
        ]
      : []),
  ];

  return (
    <AppShell nav width="full">
      <PageHeader title="เลือกดูศาล" action={<LinkButton href="/shops" variant="outline" size="xl">แผนที่ร้าน</LinkButton>} />

      <TwoColumn
        side="left"
        asideSize="sm"
        asideOn="before"
        aside={
          <div className="flex flex-col gap-4 lg:gap-0">
            <Rise>
              {/* มือถือ: แตะช่องนี้แล้วเปิดแผ่นค้นหาเต็มความสูง (ค้นหาล่าสุด คำแนะนำสด Enter ไป /browse?q= คงตัวกรอง) เดสก์ท็อปใช้ช่องในส่วนหัว */}
              <div className="lg:hidden">
                <MobileSearch variant="field" placeholder="ค้นหาศาล เช่น ศาลพระภูมิ" defaultQuery={q ?? ""} />
              </div>
            </Rise>

            <Rise i={1}>
              {/* มือถือ: แถวเดียว = ปุ่มตัวกรอง (เปิดแผ่น พื้นที่ งบ เรียงตาม) + ชิปประเภทศาล */}
              <ChipRow label="ประเภทศาล" className="lg:hidden">
                <BottomSheet
                  title="ตัวกรอง"
                  stagger
                  triggerClassName={chipClass(sheetCount > 0)}
                  trigger={
                    <>
                      <SlidersHorizontal className="size-4" aria-hidden="true" />
                      ตัวกรอง
                      {sheetCount > 0 ? (
                        <span className="numeric flex size-5 items-center justify-center rounded-full bg-primary-foreground text-sm text-primary">
                          {sheetCount}
                        </span>
                      ) : null}
                    </>
                  }
                >
                  <div style={{ "--i": 0 } as React.CSSProperties}>
                    <p className="mb-2 text-base font-medium">ตำแหน่ง</p>
                    <div role="group" aria-label="ตำแหน่ง" className="flex flex-wrap gap-2">
                      <NearMe active={Boolean(near)} />
                    </div>
                  </div>
                  <SheetGroup label="พื้นที่" options={areaOptions} index={1} />
                  <SheetGroup label="ราคาเฉพาะตัวศาล" options={maxOptions} index={2} />
                  <BudgetForm query={browseQuery} current={max} id="budget-phone" />
                  <SheetGroup label="เรียงตาม" options={sortOptions} index={3} />
                  <div style={{ "--i": 4 } as React.CSSProperties} className="flex flex-col gap-2">
                    <BottomSheetClose className={cn(buttonVariants({ variant: "default", size: "xl" }), "w-full")}>
                      ดูผลลัพธ์ {products.length} รายการ
                    </BottomSheetClose>
                    {hasFilter ? (
                      <LinkButton href="/browse" variant="ghost" className="w-full">
                        ล้างตัวกรองทั้งหมด
                      </LinkButton>
                    ) : null}
                  </div>
                </BottomSheet>
                {kindOptions.map((o) => (
                  <Chip key={o.label} href={o.href} active={o.active}>
                    {o.label}
                  </Chip>
                ))}
              </ChipRow>

              {/* เดสก์ท็อป: แผงตัวกรองด้านซ้ายเหมือนเดิม */}
              <div className="hidden lg:block">
                <h2 className="mb-5 font-display text-xl font-medium">ตัวกรอง</h2>
                <FilterGroup label="ประเภทศาล" options={kindOptions} />
                <FilterGroup
                  label="พื้นที่"
                  options={areaOptions}
                  className="mt-5 border-t border-border pt-5"
                />
                <FilterGroup
                  label="ราคาเฉพาะตัวศาล"
                  options={maxOptions}
                  className="mt-5 border-t border-border pt-5"
                />
                <BudgetForm query={browseQuery} current={max} id="budget-desktop" />
                <div role="group" aria-label="ตำแหน่ง" className="mt-5 border-t border-border pt-5">
                  <p className="mb-2 text-base font-medium">ตำแหน่ง</p>
                  <NearMe variant="row" active={Boolean(near)} />
                </div>
              </div>
            </Rise>
          </div>
        }
      >
        <SavedRow
          items={everything.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            providerName: p.provider.name,
          }))}
        />

        <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 lg:mt-0 lg:mb-5">
          <p className="text-base text-muted-foreground">
            <span>
              พบ <span className="numeric font-medium text-foreground">{products.length}</span> รายการ
              <span className="lg:hidden">{max ? ` · ไม่เกิน ${formatBaht(max)}` : ""}</span>
            </span>
          </p>
          {near ? (
            <p className="w-full text-sm text-muted-foreground">แสดงเฉพาะร้านที่ให้บริการถึงที่ของคุณ</p>
          ) : null}
          {activeFilters.length > 0 ? (
            <ul className="flex w-full flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <li key={f.label}>
                  <Link
                    href={f.href}
                    aria-label={`เอาตัวกรอง ${f.label} ออก`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/20 pr-2.5 pl-4 text-base font-medium transition-colors hover:bg-muted"
                  >
                    {f.label}
                    <X className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {hasFilter ? (
            <Link
              href="/browse"
              className="inline-flex min-h-11 items-center gap-1 text-base font-medium underline-offset-4 hover:underline lg:min-h-9"
            >
              <X className="size-4" aria-hidden="true" />
              ล้างตัวกรอง
            </Link>
          ) : null}
        </div>

        <div className="mb-5 hidden items-center gap-3 lg:flex">
          <p className="text-base text-muted-foreground">เรียงตาม</p>
          <ChipRow label="เรียงตาม">
            {sortOptions.map((o) => (
              <Chip key={o.label} href={o.href} active={o.active}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">ราคาในรายการเป็นค่าตัวศาล ยังไม่รวมพิธีและบริการเสริม</p>
        {products.length === 0 ? (
          <EmptyState
            art="search"
            title="ไม่พบศาลที่ตรงกับเงื่อนไข"
            description="ลองเอาตัวกรองด้านบนออกทีละตัว เพื่อคงเงื่อนไขอื่นที่คุณเลือกไว้"
            action={
              <LinkButton href="/browse" variant="outline">
                ล้างตัวกรอง
              </LinkButton>
            }
          />
        ) : (
          <CardGrid cols="products-side">
            {products.map((product) => (
              <Reveal as="li" key={product.id}>
                <ProductCard product={product} href={`/products/${product.id}?${new URLSearchParams({ ...(area ? { area } : {}), ...(nearParam ? { near: nearParam } : {}), from: browseHref(filters) })}`} />
              </Reveal>
            ))}
          </CardGrid>
        )}
      </TwoColumn>
    </AppShell>
  );
}
