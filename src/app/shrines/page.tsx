import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { NotificationBell } from "@/components/notification-bell";
import { Rise } from "@/components/rise";
import { EmptyState, ShrineImage, ThumbArt } from "@/components/visuals";
import { bangkokDay, careSentence } from "@/app/notifications/days";
import { AREAS, SHRINE_KINDS } from "@/lib/constants";
import { requireUser } from "@/server/auth";
import { getMyShrine, listMyShrines } from "@/server/queries";

export const metadata: Metadata = { title: "ศาลของฉัน" };

export default async function ShrinesPage() {
  const user = await requireUser("/shrines");
  const shrines = await listMyShrines(user.id);
  // ดึงบันทึกการดูแลของแต่ละศาลมาบอกว่าดูแลล่าสุดเมื่อไร (จำนวนศาลของผู้ใช้หนึ่งคนมีน้อย)
  const details = (await Promise.all(shrines.map((s) => getMyShrine(s.id, user.id)))).filter(
    (d) => d !== null,
  );
  const detailById = new Map(details.map((d) => [d.id, d]));
  const today = bangkokDay(new Date());
  const careOf = (id: string) => {
    const log = detailById.get(id)?.careLogs[0];
    return careSentence(log ? bangkokDay(log.doneAt) : null, today);
  };

  return (
    <AppShell nav width="full">
      <PageHeader
        title="ศาลของฉัน"
        backHref="/account"
        backLabel="บัญชี"
        action={
          <>
            <NotificationBell userId={user.id} />
            {shrines.length > 0 ? (
              <div className="hidden items-center gap-3 lg:flex">
                <LinkButton href="/new" variant="outline">
                  ตั้งศาลใหม่
                </LinkButton>
                <LinkButton href="/shrines/new">
                  <Plus aria-hidden="true" />
                  เพิ่มศาลที่มีอยู่
                </LinkButton>
              </div>
            ) : null}
          </>
        }
      />

      {shrines.length === 0 ? (
        <EmptyState
          title="ยังไม่มีศาลที่ลงทะเบียน"
          description="เพิ่มศาลที่มีอยู่แล้ว เพื่อจดการดูแลและเรียกใช้บริการได้ง่ายขึ้น"
          action={
            <div className="flex w-64 flex-col gap-3">
              <LinkButton href="/shrines/new" className="w-full">
                เพิ่มศาลที่มีอยู่
              </LinkButton>
              <LinkButton href="/new" variant="outline" className="w-full">
                ตั้งศาลใหม่
              </LinkButton>
            </div>
          }
        />
      ) : (
        <>
          {/* มือถือ: รายการกลุ่ม มีภาพย่อของศาลแต่ละหลัง */}
          <Rise className="lg:hidden">
            <ListGroup label="ศาลของฉัน">
              {shrines.map((shrine) => (
                <ListRow
                  key={shrine.id}
                  href={`/shrines/${shrine.id}`}
                  thumb={<ThumbArt kind={shrine.kind} src={shrine.photoUrl} size="lg" />}
                  title={shrine.name}
                  meta={
                    <>
                      {SHRINE_KINDS[shrine.kind]} · {AREAS[shrine.area]}
                      <span className="mt-0.5 block">{careOf(shrine.id)}</span>
                    </>
                  }
                />
              ))}
            </ListGroup>
          </Rise>

          {/* เดสก์ท็อป: การ์ดภาพ เห็นหน้าตาศาลแต่ละหลัง */}
          <ul className="hidden gap-x-6 gap-y-10 lg:grid lg:grid-cols-3">
            {shrines.map((shrine, index) => (
              <li key={shrine.id} className="rise" style={{ "--i": index } as React.CSSProperties}>
                <Link href={`/shrines/${shrine.id}`} className="group/card block">
                  <ShrineImage
                    src={shrine.photoUrl}
                    alt={shrine.name}
                    kind={shrine.kind}
                    seed={shrine.id}
                    className="aspect-[4/3] w-full"
                  />
                  <p className="mt-3 text-lg font-medium group-hover/card:underline group-hover/card:underline-offset-4">
                    {shrine.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {SHRINE_KINDS[shrine.kind]} · {AREAS[shrine.area]}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{careOf(shrine.id)}</p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 lg:hidden">
            <LinkButton href="/shrines/new" className="w-full">
              <Plus aria-hidden="true" />
              เพิ่มศาลที่มีอยู่
            </LinkButton>
            <LinkButton href="/new" variant="outline" className="w-full">
              ตั้งศาลใหม่
            </LinkButton>
          </div>
        </>
      )}
    </AppShell>
  );
}
