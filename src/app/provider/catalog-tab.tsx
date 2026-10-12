import Link from "next/link";
import { Plus } from "lucide-react";
import { SectionTitle } from "@/components/app-shell";
import { SoonBadge } from "@/components/coming-soon";
import { DataTable } from "@/components/data-table";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Price } from "@/components/price";
import { EmptyState, ThumbArt } from "@/components/visuals";
import { PACKAGE_TYPES, SHRINE_KINDS } from "@/lib/constants";
import type { PackageDTO, ProductDTO } from "@/lib/types";
import { CatalogToggle } from "./catalog-toggle";
import { PACKAGE_TYPE_ART } from "./icon-map";

function AddButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <LinkButton href={href} variant="secondary" size="lg" className="min-h-11 rounded-full px-5 text-base">
      <Plus />
      {children}
    </LinkButton>
  );
}

/** แท็บ "สินค้า": ศาลที่ขายและบริการเสริมของร้าน แถวหนาแน่น มีสวิตช์เปิด/ปิดขายในแถว */
export function CatalogTab({ products, packages }: { products: ProductDTO[]; packages: PackageDTO[] }) {
  return (
    <div className="max-w-5xl">
      <SectionTitle
        className="mt-6 lg:mt-8"
        action={products.length > 0 ? <AddButton href="/provider/products/new">เพิ่มศาล</AddButton> : null}
      >
        ศาลที่ขาย
      </SectionTitle>
      {products.length === 0 ? (
        <EmptyState
          title="ยังไม่มีศาลที่ขาย"
          description="เพิ่มศาลที่ร้านขาย ลูกค้าจะเห็นเมื่อเปิดขายและร้านผ่านการตรวจสอบ"
          action={
            <LinkButton href="/provider/products/new" variant="gold" size="xl">
              <Plus />
              เพิ่มศาล
            </LinkButton>
          }
        />
      ) : (
        <>
          <ListGroup label="ศาลที่ขาย" className="xl:hidden">
            {products.map((p) => (
              <li key={p.id} className="flex items-center pr-2 transition-colors hover:bg-muted">
                <Link
                  href={`/provider/products/${p.id}`}
                  className="flex min-h-16 min-w-0 flex-1 items-center gap-4 py-3 pl-4"
                >
                  <ThumbArt kind={p.kind} src={p.imageUrl} size="md" className={p.active ? undefined : "opacity-60"} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-base leading-snug font-medium">{p.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
                      {SHRINE_KINDS[p.kind]}
                    </span>
                    <Price amount={p.price} size="sm" />
                  </span>
                </Link>
                <CatalogToggle kind="product" product={p} />
              </li>
            ))}
          </ListGroup>
          <DataTable
            from="xl"
            caption="ศาลที่ขาย"
            rows={products}
            rowKey={(p) => p.id}
            rowHref={(p) => `/provider/products/${p.id}`}
            columns={[
              {
                key: "name",
                header: "ศาล",
                className: "w-full",
                cell: (p) => (
                  <span className="flex items-center gap-4">
                    <ThumbArt kind={p.kind} src={p.imageUrl} size="sm" className={p.active ? undefined : "opacity-60"} />
                    <span className="line-clamp-2 min-w-40">{p.name}</span>
                  </span>
                ),
              },
              {
                key: "kind",
                header: "ประเภท",
                className: "whitespace-nowrap text-muted-foreground",
                cell: (p) => SHRINE_KINDS[p.kind],
              },
              {
                key: "price",
                header: "ราคา",
                align: "right",
                className: "whitespace-nowrap",
                cell: (p) => <Price amount={p.price} size="sm" />,
              },
              {
                key: "active",
                header: "เปิดขาย",
                align: "right",
                className: "w-px",
                cell: (p) => (
                  <span className="relative z-10 flex justify-end">
                    <CatalogToggle kind="product" product={p} />
                  </span>
                ),
              },
            ]}
          />
        </>
      )}

      <SectionTitle
        action={packages.length > 0 ? <AddButton href="/provider/packages/new">เพิ่มบริการ</AddButton> : null}
      >
        บริการเสริม
      </SectionTitle>
      {packages.length === 0 ? (
        <EmptyState
          art="garland"
          title="ยังไม่มีบริการเสริม"
          description="เพิ่มบริการ เช่น พิธีตั้งศาล หรือการถอนศาลเก่า"
          action={
            <LinkButton href="/provider/packages/new" variant="secondary" size="xl">
              <Plus />
              เพิ่มบริการ
            </LinkButton>
          }
        />
      ) : (
        <>
          <ListGroup label="บริการเสริม" className="xl:hidden">
            {packages.map((pkg) => (
              <li key={pkg.id} className="flex items-center pr-2 transition-colors hover:bg-muted">
                <Link
                  href={`/provider/packages/${pkg.id}`}
                  className="flex min-h-16 min-w-0 flex-1 items-center gap-4 py-3 pl-4"
                >
                  <ThumbArt service={PACKAGE_TYPE_ART[pkg.type]} size="md" className={pkg.active ? undefined : "opacity-60"} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-base leading-snug font-medium">{pkg.name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{PACKAGE_TYPES[pkg.type]}</span>
                    <Price amount={pkg.price} size="sm" />
                  </span>
                </Link>
                <CatalogToggle kind="package" pkg={pkg} />
              </li>
            ))}
          </ListGroup>
          <DataTable
            from="xl"
            caption="บริการเสริมของร้าน"
            rows={packages}
            rowKey={(p) => p.id}
            rowHref={(p) => `/provider/packages/${p.id}`}
            columns={[
              {
                key: "name",
                header: "บริการ",
                className: "w-full",
                cell: (p) => (
                  <span className="flex items-center gap-4">
                    <ThumbArt service={PACKAGE_TYPE_ART[p.type]} size="sm" className={p.active ? undefined : "opacity-60"} />
                    <span className="line-clamp-2 min-w-40">{p.name}</span>
                  </span>
                ),
              },
              {
                key: "type",
                header: "ประเภท",
                className: "whitespace-nowrap text-muted-foreground",
                cell: (p) => PACKAGE_TYPES[p.type],
              },
              {
                key: "price",
                header: "ราคา",
                align: "right",
                className: "whitespace-nowrap",
                cell: (p) => <Price amount={p.price} size="sm" />,
              },
              {
                key: "active",
                header: "เปิดขาย",
                align: "right",
                className: "w-px",
                cell: (p) => (
                  <span className="relative z-10 flex justify-end">
                    <CatalogToggle kind="package" pkg={p} />
                  </span>
                ),
              },
            ]}
          />
        </>
      )}

      <ListGroup className="mt-10" label="เร็ว ๆ นี้">
        <ListRow
          title="โปรโมชันของร้าน"
          meta="ลดราคาศาลหรือบริการในช่วงที่ต้องการ"
          trailing={<SoonBadge />}
        />
      </ListGroup>
    </div>
  );
}
