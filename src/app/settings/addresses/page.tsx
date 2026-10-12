import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { EmptyState } from "@/components/visuals";
import { AREAS } from "@/lib/constants";
import { requireUser } from "@/server/auth";
import { listAddresses } from "@/server/queries";
import { AccountNav } from "../account-nav";

export const metadata: Metadata = { title: "ที่อยู่ของฉัน" };

export default async function AddressesPage() {
  const user = await requireUser("/settings/addresses");
  const addresses = await listAddresses(user.id);

  return (
    <AppShell
      side={<AccountNav />}
      desktopFooter="hide"
      footer={
        addresses.length > 0 ? (
          <LinkButton href="/settings/addresses/new" className="w-full">
            <Plus aria-hidden="true" />
            เพิ่มที่อยู่
          </LinkButton>
        ) : undefined
      }
    >
      <PageHeader
        title="ที่อยู่ของฉัน"
        backHref="/settings"
        action={
          addresses.length > 0 ? (
            <LinkButton href="/settings/addresses/new" className="hidden lg:inline-flex">
              <Plus aria-hidden="true" />
              เพิ่มที่อยู่
            </LinkButton>
          ) : undefined
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          art="lotus"
          title="ยังไม่มีที่อยู่ที่บันทึกไว้"
          description="บันทึกไว้ จะได้เลือกใช้ได้ทันทีตอนสั่งซื้อ"
          action={<LinkButton href="/settings/addresses/new">เพิ่มที่อยู่</LinkButton>}
        />
      ) : (
        <Rise>
          <ListGroup label="ที่อยู่ที่บันทึกไว้">
            {addresses.map((a) => (
              <ListRow
                key={a.id}
                href={`/settings/addresses/${a.id}`}
                title={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {a.label}
                    {a.isDefault ? (
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-sm font-normal text-muted-foreground">
                        ที่อยู่หลัก
                      </span>
                    ) : null}
                  </span>
                }
                meta={
                  <>
                    {AREAS[a.area]}
                    <span className="mt-0.5 block break-words">{a.address}</span>
                  </>
                }
              />
            ))}
          </ListGroup>
        </Rise>
      )}
    </AppShell>
  );
}
