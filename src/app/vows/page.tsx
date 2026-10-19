import type { Metadata } from "next";
import { Bell, Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Chip, ChipRow } from "@/components/chip";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { EmptyState, ThumbArt } from "@/components/visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bangkokDay, dayDiff, thaiShortDay } from "@/app/notifications/days";
import { firstValue } from "@/app/new/options";
import type { VowStatus } from "@/lib/constants";
import type { VowDTO } from "@/lib/types";
import { requireUser } from "@/server/auth";
import { listMyVows } from "@/server/queries";
import { VowStamp } from "./vow-stamp";

export const metadata: Metadata = { title: "สมุดบน" };
const GROUPS: { status: VowStatus; title: string }[] = [
  { status: "GRANTED", title: "รอแก้บน" },
  { status: "WAITING", title: "รอผล" },
  { status: "FULFILLED", title: "แก้บนแล้ว" },
];

export default async function VowsPage({ searchParams }: PageProps<"/vows">) {
  const sp = await searchParams;
  const raw = firstValue(sp.status);
  const status = GROUPS.find(group => group.status === raw)?.status;
  const q = firstValue(sp.q)?.trim().slice(0, 100) ?? "";
  const user = await requireUser("/vows");
  const vows = await listMyVows(user.id);
  const today = bangkokDay(new Date());
  const matching = vows.filter(vow => (!status || vow.status === status) &&
    (!q || [vow.place, vow.wish, vow.promise].some(text => text.toLocaleLowerCase("th").includes(q.toLocaleLowerCase("th")))));
  function href(next?: VowStatus) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (next) params.set("status", next);
    return params.size ? `/vows?${params}` : "/vows";
  }
  return <AppShell nav width="narrow">
    <PageHeader title="สมุดบน" subtitle="เห็นได้เฉพาะคุณ" action={vows.length ?
      <LinkButton href="/vows/new" variant="gold" size="xl"><Plus aria-hidden="true" />บันทึกใหม่</LinkButton> : undefined} />
    {vows.length ? <>
      <form action="/vows" method="get" className="mb-5 flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input key={q} name="q" aria-label="ค้นหาในสมุดบน" placeholder="สถานที่ สิ่งที่ขอ หรือคำสัญญา" defaultValue={q} maxLength={100} />
        <Button type="submit" variant="outline" size="xl">ค้นหา</Button>
      </form>
      <ChipRow label="สถานะการบน" className="mb-6">
        <Chip href={href()} active={!status}>ทั้งหมด {vows.length}</Chip>
        {GROUPS.map(group => <Chip key={group.status} href={href(group.status)} active={status === group.status}>
          {group.title} {vows.filter(vow => vow.status === group.status).length}
        </Chip>)}
      </ChipRow>
      <p role="status" className="mb-4 text-sm text-muted-foreground">พบ {matching.length} รายการ{q ? ` จากคำค้น “${q}”` : ""}</p>
    </> : null}
    {!matching.length ? <EmptyState art={vows.length ? "search" : "garland"}
      title={vows.length ? "ไม่พบรายการตามเงื่อนไข" : "ยังไม่มีรายการในสมุดบน"}
      description={vows.length ? "ลองเปลี่ยนคำค้น หรือกลับไปดูรายการทั้งหมด" : "จดสถานที่ สิ่งที่ขอ และคำสัญญาไว้ พร้อมตั้งวันเตือนในแอป"}
      action={<LinkButton href={vows.length ? "/vows" : "/vows/new"} variant="gold" size="xl">{vows.length ? "ดูทั้งหมด" : "บันทึกการบนใหม่"}</LinkButton>} /> :
      GROUPS.map(group => {
        const items = matching.filter(vow => vow.status === group.status).sort((a, b) => (a.remindAt ?? "9999").localeCompare(b.remindAt ?? "9999"));
        return items.length ? <Rise key={group.status} className="mb-8">
          <section aria-label={group.title}>
            <h2 className="mb-3 font-display text-xl font-medium">{group.title}</h2>
            <ListGroup label={group.title}>{items.map(vow => <VowEntry key={vow.id} vow={vow} today={today} />)}</ListGroup>
          </section>
        </Rise> : null;
      })}
  </AppShell>;
}

function VowEntry({ vow, today }: { vow: VowDTO; today: string }) {
  const days = vow.remindAt && vow.status !== "FULFILLED" ? dayDiff(today, bangkokDay(vow.remindAt)) : null;
  const reminder = days === null ? null : days < 0 ? `เลยวันเตือน ${Math.abs(days)} วัน` : days === 0 ? "เตือนวันนี้" : `เตือน ${thaiShortDay(vow.remindAt!)}`;
  return <ListRow href={`/vows/${vow.id}`} thumb={<ThumbArt service="vow" size="sm" />}
    title={<span className="break-words">{vow.wish || vow.promise}</span>}
    meta={<><span className="block break-words">{vow.place}{vow.wish ? ` · สัญญาไว้: ${vow.promise}` : ""}</span>
      {reminder ? <span className="mt-1 flex items-center gap-1.5"><Bell className="size-4 shrink-0" aria-hidden="true" />{reminder}</span> : null}</>}
    trailing={<VowStamp status={vow.status} />} />;
}
