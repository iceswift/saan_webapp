import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Rise } from "@/components/rise";
import { ThumbArt } from "@/components/visuals";
import { bangkokDay, dayDiff, thaiShortDay } from "@/app/notifications/days";
import { requireUser } from "@/server/auth";
import { getMyVow } from "@/server/queries";
import { VowStamp } from "../vow-stamp";
import { VowActions, VowDeleteButton } from "./vow-actions";
import { VowReminder } from "./vow-reminder";

export const metadata: Metadata = { title: "รายการบน" };

export default async function VowPage({ params }: PageProps<"/vows/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/vows/${id}`);
  const vow = await getMyVow(id, user.id);
  if (!vow) notFound();

  // วันที่ตามเวลาไทย คำนวณบนเซิร์ฟเวอร์ เพื่อให้ช่องวันที่ตรงกับวันที่บันทึกจริง
  const now = new Date();
  const today = bangkokDay(now);
  const remindDate = vow.remindAt ? bangkokDay(vow.remindAt) : "";
  const daysLeft = remindDate ? dayDiff(today, remindDate) : null;
  const minRemindAt = bangkokDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  return (
    <AppShell width="narrow">
      <PageHeader title="รายการบน" backHref="/vows" backLabel="สมุดบน" />

      <Rise>
        <article className="flex gap-4">
          <ThumbArt service="vow" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-base break-words text-muted-foreground">{vow.place}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <VowStamp status={vow.status} />
              <span className="text-sm text-muted-foreground">จดไว้เมื่อ {thaiShortDay(vow.createdAt)}</span>
            </div>
          </div>
        </article>

        <dl className="mt-8 flex flex-col gap-6">
          <div>
            <dt className="text-sm text-muted-foreground">เรื่องที่ขอ</dt>
            <dd className="mt-1 font-display text-2xl leading-snug font-normal break-words whitespace-pre-line text-balance">
              {vow.wish || "ไม่ได้ระบุ"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">สัญญาว่าจะถวาย</dt>
            <dd className="mt-1 text-lg break-words whitespace-pre-line">{vow.promise}</dd>
          </div>
        </dl>
      </Rise>

      <Rise i={1}>
        <div className="mt-10">
          <VowActions vowId={vow.id} status={vow.status} promise={vow.promise} updatedAt={vow.updatedAt} />
        </div>
      </Rise>

      {vow.status !== "FULFILLED" ? (
        <Rise i={2}>
          <div className="mt-10 border-t border-border pt-8">
            <VowReminder
              key={vow.remindAt ?? "none"}
              vowId={vow.id}
              remindText={vow.remindAt ? thaiShortDay(vow.remindAt) : null}
              remindDate={remindDate}
              minRemindAt={minRemindAt}
              daysLeft={daysLeft}
            />
          </div>
        </Rise>
      ) : null}

      <div className="mt-10 border-t border-border pt-6">
        <VowDeleteButton vowId={vow.id} />
      </div>
    </AppShell>
  );
}
