import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { NotificationBell } from "@/components/notification-bell";
import { Reveal } from "@/components/reveal";
import { Rise } from "@/components/rise";
import { ServiceArt, ThumbArt } from "@/components/visuals";
import { bangkokDay, dayDiff, thaiShortDay } from "@/app/notifications/days";
import type { VowStatus } from "@/lib/constants";
import type { VowDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { listMyVows } from "@/server/queries";
import { VowStamp } from "./vow-stamp";

export const metadata: Metadata = { title: "สมุดบน" };

/** ลำดับกลุ่มในหน้า: รายการที่รอแก้บนอยู่บนสุดเพราะเป็นสิ่งที่ต้องทำต่อ */
const GROUPS: { status: VowStatus; title: string }[] = [
  { status: "GRANTED", title: "รอแก้บน" },
  { status: "WAITING", title: "รอผล" },
  { status: "FULFILLED", title: "แก้บนแล้ว" },
];

export default async function VowsPage() {
  const user = await requireUser("/vows");
  const vows = await listMyVows(user.id);
  const today = bangkokDay(new Date());

  return (
    <AppShell nav width="narrow">
      <PageHeader
        title="สมุดบน"
        subtitle="เห็นได้เฉพาะคุณ"
        action={
          <>
            <NotificationBell userId={user.id} />
            {vows.length > 0 ? (
              <LinkButton href="/vows/new" variant="gold" className="hidden lg:inline-flex">
                <Plus aria-hidden="true" />
                บันทึกการบนใหม่
              </LinkButton>
            ) : null}
          </>
        }
      />

      {vows.length === 0 ? (
        <Rise>
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <div
              aria-hidden="true"
              style={{ "--arch-r": "5.5rem" } as React.CSSProperties}
              className="arch-top flex h-48 w-44 items-end justify-center overflow-hidden bg-muted pb-2"
            >
              <ServiceArt name="vow" className="size-36" />
            </div>
            <h2 className="mt-4 font-display text-xl font-normal text-balance">ยังไม่มีรายการในสมุดบน</h2>
            <p className="mt-1.5 max-w-xs text-base text-muted-foreground">
              จดว่าบนอะไรไว้ที่ไหน และสัญญาว่าจะถวายอะไร จะได้ไม่ลืมเมื่อถึงเวลา
            </p>
            <LinkButton href="/vows/new" variant="gold" className="mt-6">
              บันทึกการบนใหม่
            </LinkButton>
          </div>
        </Rise>
      ) : (
        <>
          <Rise i={1} className="lg:hidden">
            <LinkButton href="/vows/new" variant="gold" className="w-full">
              <Plus aria-hidden="true" />
              บันทึกการบนใหม่
            </LinkButton>
          </Rise>

          {GROUPS.map((group, groupIndex) => {
            const items = vows.filter((v) => v.status === group.status);
            if (items.length === 0) return null;
            return (
              <section key={group.status} aria-labelledby={`vows-${group.status}`} className="mt-10 first-of-type:mt-8">
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
                  <h2 id={`vows-${group.status}`} className="font-display text-xl font-medium lg:text-2xl">
                    {group.title}
                  </h2>
                  <span className="numeric text-sm text-muted-foreground">{items.length} รายการ</span>
                </div>
                <ul>
                  {items.map((vow, i) => (
                    <Reveal as="li" key={vow.id} i={(groupIndex + i) % 4} className="border-b border-border last:border-b-0">
                      <VowEntry vow={vow} today={today} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </AppShell>
  );
}

/** หนึ่งรายการในสมุด: ภาพ ที่ที่บน เรื่องที่ขอ (ตัวใหญ่) คำสัญญา และวันเตือน */
function VowEntry({ vow, today }: { vow: VowDTO; today: string }) {
  const headline = vow.wish || vow.promise;
  const showReminder = vow.remindAt && vow.status !== "FULFILLED";
  const daysLeft = showReminder ? dayDiff(today, bangkokDay(vow.remindAt as string)) : null;
  const soon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  return (
    <Link
      href={`/vows/${vow.id}`}
      className="group/row -mx-3 flex gap-4 rounded-lg px-3 py-6 transition-colors hover:bg-muted"
    >
      <ThumbArt service="vow" size="md" className="max-sm:size-14" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="min-w-0 truncate text-sm text-muted-foreground">{vow.place}</span>
          <VowStamp status={vow.status} />
        </span>
        <span className="mt-2 block font-display text-xl leading-snug font-normal break-words text-balance lg:text-2xl">
          {headline}
        </span>
        {vow.wish ? (
          <span className="mt-1.5 block text-base break-words text-muted-foreground">สัญญาไว้: {vow.promise}</span>
        ) : null}
        {showReminder ? (
          <span className={cn("mt-2 flex items-center gap-1.5 text-sm", soon ? "text-gold-ink" : "text-muted-foreground")}>
            <Bell className="size-4 shrink-0" aria-hidden="true" />
            เตือนวันที่ {thaiShortDay(vow.remindAt as string)}
            {daysLeft === 0 ? " (วันนี้)" : soon ? ` (อีก ${daysLeft} วัน)` : ""}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
