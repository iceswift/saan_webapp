import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Wordmark } from "@/components/brand";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { NotificationBell } from "@/components/notification-bell";
import { CardGrid } from "@/components/page-layout";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { Rise } from "@/components/rise";
import { HomeSkeleton } from "@/components/skeletons";
import { TextLink } from "@/components/text-link";
import { TrustNote } from "@/components/trust-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceArt, ShrineImage, ThumbArt, type ServiceArtName } from "@/components/visuals";
import { type OrderType } from "@/lib/constants";
import { formatBaht, formatShortDate } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth";
import { listMyOrders, listMyShrines, listProducts } from "@/server/queries";

const SERVICES: { title: string; description: string; href: string; art: ServiceArtName }[] = [
  {
    title: "ตั้งศาลใหม่",
    description: "เลือกศาล พิธี และของไหว้ ให้ร้านที่ตรวจสอบแล้วมาติดตั้งให้",
    href: "/new",
    art: "install",
  },
  {
    title: "ถอน ย้าย รับศาลเก่า",
    description: "ถอนศาล ย้ายตำแหน่ง หรือส่งศาลเก่าไปวัดอย่างเหมาะสม",
    href: "/request/new?type=REMOVE",
    art: "move",
  },
  {
    title: "ซ่อมและบูรณะ",
    description: "รับใบเสนอราคาจากหลายร้านสำหรับศาลที่ชำรุด",
    href: "/request/new?type=REPAIR",
    art: "repair",
  },
  {
    title: "สมุดบน",
    description: "จดสิ่งที่บนไว้ และตั้งเตือนเมื่อถึงเวลาแก้บน",
    href: "/vows",
    art: "vow",
  },
];

const STEPS = [
  { title: "เลือกศาล", text: "ดูแบบ ราคา และพื้นที่ที่ร้านให้บริการ เทียบกันได้ในที่เดียว" },
  { title: "ร้านยืนยัน", text: "จ่ายมัดจำ แล้วร้านยืนยันงานและนัดวันเข้าติดตั้งกับคุณ" },
  { title: "ติดตั้งและทำพิธี", text: "ร้านเข้างานตามวันนัด และอัปเดตความคืบหน้าให้เห็นทุกขั้น" },
  { title: "ตรวจรับงาน", text: "ดูงานจริงก่อน แล้วจึงยืนยันและจ่ายส่วนที่เหลือ" },
];

const ORDER_ART: Record<OrderType, ServiceArtName> = {
  INSTALL: "install",
  REMOVE: "move",
  REPAIR: "repair",
};

const FOOTER_LINKS = [
  { label: "เลือกดูศาลทั้งหมด", href: "/browse" },
  { label: "คู่มือความรู้", href: "/guide/orientation" },
  { label: "ช่วยเหลือ", href: "/help" },
  { label: "ข้อกำหนดและนโยบาย", href: "/legal/terms" },
];

/** สิ่งที่ลูกค้าต้องทำต่อ (หรือสถานะที่รอ) ของแต่ละงาน เป็นข้อความหลักของแถว */
function nextAction(order: OrderSummary): { text: string; todo: boolean } {
  switch (order.status) {
    case "AWAITING_DEPOSIT":
      return { text: `จ่ายมัดจำ ${formatBaht(order.deposit)}`, todo: true };
    case "AWAITING_PROVIDER":
      return { text: "รอร้านยืนยันงาน", todo: false };
    case "CONFIRMED":
      return {
        text: order.scheduledAt ? `ร้านนัดเข้างาน ${formatShortDate(order.scheduledAt)}` : "ร้านยืนยันแล้ว รอนัดวัน",
        todo: false,
      };
    case "DONE":
      return { text: "ตรวจรับงาน", todo: true };
    default:
      return { text: "ดูรายละเอียดงาน", todo: false };
  }
}

/** หัวข้อส่วนแบบเรียบ: เลขลำดับสีเทา + หัวข้อ ไม่มีป้ายสีชาด */
function Heading({
  index,
  title,
  description,
  action,
  className,
}: {
  index?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {index ? <p className="numeric text-sm text-muted-foreground">{index}</p> : null}
        <h2 className="font-display text-2xl leading-snug font-normal text-balance lg:text-[2rem]">{title}</h2>
        {description ? <p className="mt-1.5 max-w-xl text-base text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** หน้าแรก: โครงหน้า (AppShell) ออกก่อน เนื้อหาที่ต้องรอข้อมูลสตรีมตามมา โดยมีโครงรอโหลดทรงเดียวกันคั่นไว้ */
export default function HomePage() {
  return (
    <AppShell nav width="full">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </AppShell>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  const [orders, shrines, products] = await Promise.all([
    user ? listMyOrders(user.id) : Promise.resolve([] as OrderSummary[]),
    user ? listMyShrines(user.id) : Promise.resolve([]),
    listProducts({ sort: "newest" }),
  ]);
  const ongoing = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").slice(0, 3);
  const newest = products.slice(0, 6);
  const [primary] = SERVICES;
  // ผู้ใช้ที่มีงานค้าง เริ่มที่งานของตัวเอง ผู้เยี่ยมชมและคนที่ไม่มีงานค้างเห็นหน้าแนะนำ
  const returning = ongoing.length > 0;

  return (
    <>
      <Rise className="lg:hidden">
        <header className="flex items-center justify-between">
          <Wordmark size="md" />
          {user ? (
            <NotificationBell userId={user.id} />
          ) : (
            <LinkButton href="/login" variant="outline" size="lg" className="min-h-11 px-5 text-base">
              เข้าสู่ระบบ
            </LinkButton>
          )}
        </header>
      </Rise>

      {returning ? (
        <Rise i={1}>
          <section className="mt-6 lg:mt-0">
            <Heading
              title={user?.name ? `งานของคุณ ${user.name}` : "งานของคุณ"}
              className="mb-4 lg:mb-5"
              action={<TextLink href="/orders">ดูทั้งหมด</TextLink>}
            />
            <ListGroup>
              {ongoing.map((order) => {
                const next = nextAction(order);
                return (
                  <ListRow
                    key={order.id}
                    href={`/orders/${order.id}`}
                    thumb={<ThumbArt service={ORDER_ART[order.type]} size="md" />}
                    title={<span className={next.todo ? "text-gold-ink" : undefined}>{next.text}</span>}
                    meta={`${order.title} · ${order.providerName}`}
                  />
                );
              })}
            </ListGroup>
            {shrines.length > 0 ? (
              <div className="mt-3">
                <ListGroup>
                  <ListRow
                    href="/shrines"
                    thumb={<ThumbArt kind={shrines[0].kind} size="sm" />}
                    title="ศาลของฉัน"
                    meta={shrines.length === 1 ? shrines[0].name : `${shrines.length} หลัง`}
                  />
                </ListGroup>
              </div>
            ) : null}
          </section>
        </Rise>
      ) : (
        <Rise i={1}>
          <section className="mt-5 overflow-hidden surface-hero p-6 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-12 lg:py-14 lg:pr-14 lg:pl-14 xl:gap-x-16 xl:py-16 xl:pr-20 xl:pl-20">
            <div className="lg:col-start-1 lg:row-start-1">
              {user?.name ? <p className="eyebrow">สวัสดี {user.name}</p> : null}
              <h1 className="mt-2 font-display text-[2.25rem] leading-[1.2] font-normal text-balance sm:text-5xl lg:mt-4 lg:text-[3rem] lg:leading-[1.15] xl:text-[4rem] xl:leading-[1.12]">
                ดูแลเรื่องศาล
                <span className="block text-muted-foreground">ครบจบในที่เดียว</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-muted-foreground lg:mt-6 lg:max-w-lg lg:text-lg">
                ค้นหาศาล ช่างฝีมือ พิธีกรรม และร้านค้าที่ผ่านการตรวจสอบ พร้อมราคาที่เห็นชัดก่อนตัดสินใจ
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-9">
                <LinkButton href={primary.href} variant="gold" className="group/cta w-full sm:w-auto">
                  {primary.title}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform duration-200 ease-soft group-hover/cta:translate-x-1"
                  />
                </LinkButton>
                <LinkButton href="/browse" variant="outline" className="hidden sm:inline-flex">
                  เลือกดูศาลทั้งหมด
                </LinkButton>
              </div>
            </div>
            {/* ภาพหลัก: ฉากศาลในกรอบซุ้มโค้ง (รูปทรงเดียวกับโลโก้) มีป้าย "ภาพประกอบ" กำกับเพราะยังไม่ใช่รูปถ่ายจริง */}
            <div className="mt-8 flex justify-center lg:col-start-2 lg:row-start-1 lg:mt-0 [.text-large_&]:max-lg:hidden">
              <ShrineImage
                src={null}
                alt="ภาพประกอบศาลพระภูมิ"
                kind="PHRA_PHUM"
                seed="home-hero"
                arch
                flush
                showCaption
                className="[--arch-r:7rem] h-60 w-56 sm:h-72 sm:w-64 lg:h-[24rem] lg:w-[19rem] xl:h-[29rem] xl:w-[23rem]"
              />
            </div>
          </section>
        </Rise>
      )}

      <Rise i={2}>
        <form action="/browse" method="get" role="search" className="relative mt-4 lg:hidden">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            type="search"
            aria-label="ค้นหาศาลและบริการ"
            placeholder="ค้นหาศาล เช่น ทรงไทย"
            className="pr-28 pl-12"
          />
          <Button type="submit" className="absolute top-1/2 right-1 h-10 -translate-y-1/2 px-5 text-base">
            ค้นหา
          </Button>
        </form>
      </Rise>

      {/* บริการ: ซ้ายเป็นหัวข้อติดค้าง ขวาเป็นรายการเลขลำดับ คั่นด้วยเส้นบาง ไม่ใช้การ์ดเท่ากันสี่ใบ */}
      <section className="mt-12 lg:mt-20 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <Reveal className="lg:sticky lg:top-[calc(var(--site-header-h)+2rem)] lg:self-start">
          <Heading index="01" title="ให้เราช่วยเรื่องไหน" />
        </Reveal>
        <ul className="mt-5 border-b border-border lg:mt-0">
          {SERVICES.map((service, index) => (
            <Reveal as="li" key={service.href} i={index} className="border-t border-border">
              <Link
                href={service.href}
                className="group/row -mx-2 flex items-center gap-4 rounded-2xl px-2 py-4 transition-colors hover:bg-muted lg:gap-6 lg:py-5"
              >
                <span className="numeric w-6 shrink-0 text-sm text-muted-foreground lg:w-8 lg:text-base">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-snug font-medium lg:text-xl">
                    {service.title}
                  </span>
                  <span className="mt-0.5 block text-base text-muted-foreground">{service.description}</span>
                </span>
                <span className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted lg:size-24">
                  <ServiceArt
                    name={service.art}
                    className="size-full p-1 transition-transform duration-500 ease-soft group-hover/row:scale-110"
                  />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="hidden size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-soft group-hover/row:translate-x-1 group-hover/row:text-foreground sm:block"
                />
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {newest.length > 0 ? (
        <section className="mt-14 lg:mt-24">
          <Reveal>
            <Heading
              index="02"
              title="ศาลมาใหม่"
              className="mb-5 lg:mb-7"
              action={<TextLink href="/browse" className="max-sm:hidden">ดูทั้งหมด</TextLink>}
            />
          </Reveal>
          <CardGrid cols="products" className="lg:grid-cols-3">
            {newest.map((product, index) => (
              <Reveal as="li" key={product.id} i={index % 3}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </CardGrid>
          <div className="mt-4 sm:hidden">
            <TextLink href="/browse">ดูศาลทั้งหมด</TextLink>
          </div>
        </section>
      ) : null}

      {/* ขั้นตอน: สี่ช่องคั่นด้วยเส้นบน ตัวเลขดัชนีเล็ก ๆ */}
      <section className="mt-14 lg:mt-24">
        <Reveal>
          <Heading index="03" title="จากเลือกศาลถึงตรวจรับงาน" className="mb-6 lg:mb-9" />
        </Reveal>
        <ol className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} i={index} className="border-t border-foreground pt-4">
              <span className="numeric font-display text-4xl leading-none font-normal">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 font-display text-xl leading-snug font-medium">{step.title}</p>
              <p className="mt-1.5 text-base text-muted-foreground">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ความมั่นใจ: คำมั่นจริงของระบบ (ไม่มีตัวเลขสถิติ) */}
      <Reveal as="section" className="mt-14 lg:mt-24">
        <TrustNote layout="row" />
      </Reveal>

      {/* สมุดบน: ส่วนแบ่งสองฝั่งบนเส้นบางเท่านั้น ไม่ใช้กล่องหรือพื้นเบจ (พื้นเบจมีเฉพาะแผงเด่นด้านบน) */}
      <Reveal as="section" className="mt-14 border-t border-border pt-10 lg:mt-24 lg:pt-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16">
          <div>
            <Heading title="จดสิ่งที่บนไว้ จะได้ไม่ลืมแก้บน" />
            <p className="mt-3 max-w-lg text-base text-muted-foreground">
              บันทึกสถานที่ สิ่งที่ขอ และสิ่งที่สัญญาไว้ แล้วตั้งเตือนในแอปเมื่อใกล้วันแก้บน
              สมุดนี้เป็นเพียงที่จดบันทึกของคุณ ไม่ได้รับรองผลของการบน
            </p>
            <div className="mt-5">
              <TextLink href="/vows">เปิดสมุดบน</TextLink>
            </div>
          </div>
          <ServiceArt name="vow" className="mt-8 size-44 lg:mt-0 lg:ml-auto lg:size-64" />
        </div>
      </Reveal>

      <footer className="mt-12 border-t border-border pt-6 lg:hidden">
        <Wordmark size="md" />
        <ul className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Saan. สงวนลิขสิทธิ์ทั้งหมด
        </p>
      </footer>
    </>
  );
}
