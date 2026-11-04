import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ArchMark } from "@/components/brand";
import { Chip, ChipRow } from "@/components/chip";
import { NotificationBell } from "@/components/notification-bell";
import { Notice } from "@/components/notice";
import { Rating } from "@/components/rating";
import { Rise } from "@/components/rise";
import { ProviderStatusBadge } from "@/components/status-badge";
import { AREAS, PROVIDER_KINDS } from "@/lib/constants";
import { requireUser } from "@/server/auth";
import {
  getMyProvider,
  listBlockedDates,
  listOpenRequestsForProvider,
  listProviderOrders,
  listProviderPackages,
  listProviderProducts,
} from "@/server/queries";
import { CalendarTab } from "./calendar-tab";
import { CatalogTab } from "./catalog-tab";
import { OrdersTab, parseOrderFilter } from "./orders-tab";
import { providerNavBadges } from "./nav-data";
import { ProviderNav } from "./provider-nav";
import { ProviderProfileForm } from "./provider-profile-form";
import { parseRequestFilter, RequestsTab } from "./requests-tab";

export const metadata: Metadata = { title: "ร้านของฉัน" };

const TABS = [
  { value: "orders", label: "งาน" },
  { value: "calendar", label: "ปฏิทิน" },
  { value: "requests", label: "คำขอ" },
  { value: "catalog", label: "สินค้า" },
  { value: "profile", label: "ข้อมูลร้าน" },
] as const;

type Tab = (typeof TABS)[number]["value"];

function parseTab(raw: string | string[] | undefined): Tab {
  const found = TABS.find((t) => t.value === raw);
  return found ? found.value : "orders";
}

export default async function ProviderPage({ searchParams }: PageProps<"/provider">) {
  const user = await requireUser("/provider");
  const provider = await getMyProvider(user.id);

  // ยังไม่ได้สมัคร: แสดงหน้าต้อนรับและฟอร์มสมัคร
  if (!provider) {
    return (
      <ProviderProfileForm
        mode="register"
        initial={{ name: "", kind: null, description: "", phone: user.phone, areas: [] }}
      />
    );
  }

  const query = await searchParams;
  const tab = parseTab(query.tab);
  const [orders, requests, products, packages, blockedDates] = await Promise.all([
    listProviderOrders(provider.id),
    listOpenRequestsForProvider(provider),
    listProviderProducts(provider.id),
    listProviderPackages(provider.id),
    tab === "calendar" ? listBlockedDates(provider.id) : Promise.resolve([] as string[]),
  ]);

  const verified = provider.status === "VERIFIED";
  const badges: Partial<Record<Tab, number>> = providerNavBadges(provider, orders, requests);

  return (
    <AppShell width="full" side={<ProviderNav current={tab} badges={badges} />}>
      <PageHeader title={provider.name} backHref="/account" action={<NotificationBell userId={user.id} />} />

      <Rise>
        <div className="-mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted-foreground">
          <ProviderStatusBadge status={provider.status} />
          <Link href="/provider/finance" className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">การเงินร้าน</Link>
          <span>{PROVIDER_KINDS[provider.kind]}</span>
          {provider.areas.length > 0 ? <span>{provider.areas.map((a) => AREAS[a]).join(" · ")}</span> : null}
          <Rating
            value={provider.rating}
            count={provider.rating === null ? undefined : provider.reviewCount}
            size="sm"
          />
          {verified ? (
            <Link
              href={`/shops/${provider.id}`}
              className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4 lg:min-h-9"
            >
              ดูหน้าร้านที่ลูกค้าเห็น
            </Link>
          ) : null}
        </div>
      </Rise>

      {provider.status === "PENDING" ? (
        <div className="mt-5 flex items-start gap-4 surface-quiet p-4">
          <ArchMark className="mt-0.5 size-9" />
          <div className="min-w-0">
            <p className="text-base font-medium">รอทีมงานตรวจสอบร้าน</p>
            <p className="text-sm text-muted-foreground">
              ระหว่างนี้เพิ่มศาลและบริการไว้ก่อนได้ ลูกค้าจะเห็นร้านเมื่อผ่านการตรวจสอบ
            </p>
          </div>
        </div>
      ) : null}
      {provider.status === "REJECTED" ? (
        <Notice tone="rose" className="mt-5">
          ใบสมัครไม่ผ่านการตรวจสอบ กรุณาติดต่อทีมงาน
        </Notice>
      ) : null}

      <Rise i={1} className="lg:hidden">
        <nav aria-label="เมนูร้าน" className="mt-5">
          <ChipRow>
            {TABS.map((t) => {
              const count = badges[t.value as "orders" | "requests"] ?? 0;
              return (
                <Chip key={t.value} href={`/provider?tab=${t.value}`} active={t.value === tab}>
                  {t.label}
                  {count > 0 ? <span className="numeric opacity-70">{count}</span> : null}
                </Chip>
              );
            })}
          </ChipRow>
        </nav>
      </Rise>

      {tab === "orders" ? (
        <OrdersTab
          provider={provider}
          orders={orders}
          requests={requests}
          productCount={products.length}
          packageCount={packages.length}
          filter={parseOrderFilter(query.f)}
        />
      ) : null}
      {tab === "calendar" ? <CalendarTab orders={orders} blocked={blockedDates} /> : null}
      {tab === "requests" ? (
        <RequestsTab provider={provider} requests={requests} filter={parseRequestFilter(query.f)} />
      ) : null}
      {tab === "catalog" ? <CatalogTab products={products} packages={packages} /> : null}
      {tab === "profile" ? (
        <div className="mt-6 lg:mt-8">
          <ProviderProfileForm
            mode="profile"
            initial={{
              name: provider.name,
              kind: provider.kind,
              description: provider.description,
              phone: provider.phone,
              areas: provider.areas,
              publicAddress: provider.publicAddress,
              contactHours: provider.contactHours,
              coverUrl: provider.coverUrl,
              base: provider.location,
              serviceRadiusKm: provider.serviceRadiusKm,
            }}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
