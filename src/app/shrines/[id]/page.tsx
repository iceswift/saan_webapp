import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { Reveal } from "@/components/reveal";
import { Rise } from "@/components/rise";
import { OrderStatusBadge, RequestStatusBadge } from "@/components/status-badge";
import { TwoColumn } from "@/components/page-layout";
import { ShrineImage, ThumbArt } from "@/components/visuals";
import { SERVICE_ART_NAME } from "@/app/orders/display";
import { ageSince, bangkokDay, careSentence, dayDiff, daysAgoLabel, thaiShortDay } from "@/app/notifications/days";
import { AREAS, ORDER_TYPES, REQUEST_TYPES, SHRINE_KINDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getMyShrine } from "@/server/queries";
import { DeleteShrineButton } from "../delete-shrine-button";
import { CareLogDeleteButton } from "./care-log-delete-button";
import { CareLogForm } from "./care-log-form";
import { CareTools } from "./care-tools";

export const metadata: Metadata = { title: "รายละเอียดศาล" };

/** ผ่านกี่วันแล้วจึงชวนจดการดูแลครั้งต่อไป */
const GENTLE_REMINDER_DAYS = 14;

export default async function ShrineDetailPage({ params }: PageProps<"/shrines/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/shrines/${id}`);
  const shrine = await getMyShrine(id, user.id);
  if (!shrine) notFound();

  // วันนี้ตามเวลาไทย คำนวณบนเซิร์ฟเวอร์เพื่อไม่ให้ค่าไม่ตรงกันตอน hydrate
  const today = bangkokDay(new Date());
  const hasRelated = shrine.orders.length > 0 || shrine.requests.length > 0;
  const age = shrine.installedAt ? ageSince(bangkokDay(shrine.installedAt), today) : null;
  const lastCareDay = shrine.careLogs[0] ? bangkokDay(shrine.careLogs[0].doneAt) : null;
  const daysSinceCare = lastCareDay ? dayDiff(lastCareDay, today) : null;
  const overdue = daysSinceCare !== null && daysSinceCare >= GENTLE_REMINDER_DAYS;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "ประเภท", value: SHRINE_KINDS[shrine.kind] },
    { label: "พื้นที่", value: AREAS[shrine.area] },
    ...(shrine.address ? [{ label: "ที่อยู่", value: shrine.address }] : []),
    ...(shrine.installedAt
      ? [
          {
            label: "ตั้งเมื่อ",
            value: (
              <>
                {thaiShortDay(shrine.installedAt)}
                {age ? <span className="text-muted-foreground"> ({age})</span> : null}
              </>
            ),
          },
        ]
      : []),
  ];

  const serviceRows = (
    <ListGroup label="บริการสำหรับศาลนี้">
      <ListRow
        href="/request/new?type=REPAIR"
        thumb={<ThumbArt service="repair" size="sm" />}
        title="ขอซ่อม"
        meta="รับใบเสนอราคาจากร้าน"
      />
      <ListRow
        href="/request/new?type=REMOVE"
        thumb={<ThumbArt service="move" size="sm" />}
        title="ถอนหรือย้าย"
        meta="รับใบเสนอราคาจากร้าน"
      />
    </ListGroup>
  );

  return (
    <AppShell width="full">
      <PageHeader title={shrine.name} backHref="/shrines" backLabel="ศาลของฉัน" />

      {/* ฟอร์มสูงเกินหน้าต่างทั่วไป จึงไม่ติดค้าง (ถ้าติดค้างจะต้องเลื่อนในแผงเพื่อไปถึงปุ่มบันทึก) */}
      <TwoColumn
        asideOn="hide"
        sticky={false}
        aside={
          <div className="flex flex-col gap-8 lg:border-l lg:border-border lg:pl-10 xl:pl-14">
            <section>
              <h2 className="mb-5 font-display text-xl font-medium">จดการดูแล</h2>
              <CareLogForm shrineId={shrine.id} today={today} />
            </section>
            {serviceRows}
          </div>
        }
      >
        <Rise>
          <section className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-center lg:gap-10">
            <ShrineImage
              arch
              showCaption
              src={shrine.photoUrl}
              alt={shrine.name}
              kind={shrine.kind}
              seed={shrine.id}
              className="mx-auto aspect-[4/5] w-full max-w-72 [--arch-r:9rem] lg:mx-0"
            />
            <dl className="mt-6 divide-y divide-border border-y border-border lg:mt-0">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="shrink-0 text-base text-muted-foreground">{fact.label}</dt>
                  <dd className="min-w-0 text-right text-base break-words">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Rise>

        <Rise i={1}>
          <p className="mt-6 flex items-start gap-3 text-base" role="status">
            <span
              aria-hidden="true"
              className={cn("mt-2.5 size-2.5 shrink-0 rounded-full", overdue ? "bg-gold" : "bg-muted-foreground")}
            />
            <span>
              {careSentence(lastCareDay, today)}
              {overdue ? (
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  ถ้าได้ดูแลศาลแล้ว จดไว้ได้เลย
                </span>
              ) : null}
              {lastCareDay === null ? (
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  จดสิ่งที่ทำไว้ จะได้เห็นประวัติครบในที่เดียว
                </span>
              ) : null}
            </span>
          </p>
        </Rise>

        <div className="mt-8 lg:hidden">{serviceRows}</div>

        <div className="lg:hidden">
          <SectionTitle>จดการดูแล</SectionTitle>
          <CareLogForm shrineId={shrine.id} today={today} />
        </div>

        <SectionTitle
          className="lg:mt-12"
          action={
            shrine.careLogs.length > 0 ? (
              <span className="numeric pb-1 text-sm text-muted-foreground">{shrine.careLogs.length} รายการ</span>
            ) : undefined
          }
        >
          ประวัติการดูแล
        </SectionTitle>
        {shrine.careLogs.length === 0 ? (
          <p className="text-base text-muted-foreground">ยังไม่มีบันทึก</p>
        ) : (
          <ol className="ml-1.5 border-l border-border">
            {shrine.careLogs.map((log, index) => {
              const logDay = bangkokDay(log.doneAt);
              return (
                <Reveal as="li" key={log.id} i={index % 4} className="relative pb-8 pl-6 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-2 -left-[0.3125rem] size-2.5 rounded-full bg-foreground ring-4 ring-background"
                  />
                  <p className="text-sm text-muted-foreground">
                    {thaiShortDay(log.doneAt)} · {daysAgoLabel(dayDiff(logDay, today))}
                  </p>
                  <p className="mt-0.5 text-base font-medium break-words">{log.title}</p>
                  {log.note ? (
                    <p className="mt-1 text-base break-words whitespace-pre-line text-muted-foreground">{log.note}</p>
                  ) : null}
                  {log.photoUrl ? (
                    <ShrineImage src={log.photoUrl} alt={log.title} className="mt-3 aspect-[4/3] w-full max-w-sm" />
                  ) : null}
                  <div className="mt-1">
                    <CareLogDeleteButton careLogId={log.id} />
                  </div>
                </Reveal>
              );
            })}
          </ol>
        )}

        {hasRelated ? (
          <>
            <SectionTitle>งานที่เกี่ยวกับศาลนี้</SectionTitle>
            <ListGroup label="งานที่เกี่ยวกับศาลนี้">
              {shrine.orders.map((order) => (
                <ListRow
                  key={`order-${order.id}`}
                  href={`/orders/${order.id}`}
                  thumb={<ThumbArt service={SERVICE_ART_NAME[order.type]} size="sm" />}
                  title={order.title}
                  meta={`${ORDER_TYPES[order.type]} · ${thaiShortDay(order.createdAt)}`}
                  trailing={<OrderStatusBadge status={order.status} />}
                />
              ))}
              {shrine.requests.map((request) => (
                <ListRow
                  key={`request-${request.id}`}
                  href={`/requests/${request.id}`}
                  thumb={<ThumbArt service={SERVICE_ART_NAME[request.type]} size="sm" />}
                  title={REQUEST_TYPES[request.type]}
                  meta={`คำขอใบเสนอราคา · ${thaiShortDay(request.createdAt)}`}
                  trailing={<RequestStatusBadge status={request.status} />}
                />
              ))}
            </ListGroup>
          </>
        ) : null}

        <SectionTitle>ตัวช่วยดูแล</SectionTitle>
        <CareTools />

        <div className="mt-10 lg:max-w-xs">
          <DeleteShrineButton shrineId={shrine.id} name={shrine.name} />
        </div>
      </TwoColumn>
    </AppShell>
  );
}
