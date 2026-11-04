import type { Metadata } from "next";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { supportConfiguration } from "@/server/launch-config";
import { FaqSearch } from "./faq-search";
import { HELP_STEPS } from "./faq-data";

export const metadata: Metadata = { title: "ช่วยเหลือ" };

export default function HelpPage() {
  const { contacts } = supportConfiguration();

  return (
    <AppShell>
      <PageHeader title="ช่วยเหลือ" backHref="/" backLabel="หน้าแรก" />

      <Rise>
        <SectionTitle className="mt-0 lg:mt-0">วิธีใช้งาน</SectionTitle>
        <ol className="divide-y divide-border border-y border-border">
          {HELP_STEPS.map((step, i) => (
            <li key={step.label} className="flex items-baseline gap-4 py-4">
              <span className="numeric w-6 shrink-0 text-base text-muted-foreground">{i + 1}</span>
              <span className="text-base">{step.label}</span>
            </li>
          ))}
        </ol>
      </Rise>

      <Rise i={1}>
        <FaqSearch />
      </Rise>

      <SectionTitle>ติดต่อทีมงาน</SectionTitle>
      {contacts.length > 0 ? (
        <ListGroup label="ช่องทางติดต่อ">
          {contacts.map((c) => (
            <ListRow key={c.label} href={c.href} title={c.value} meta={c.label} trailing={c.href ? undefined : null} />
          ))}
        </ListGroup>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-muted-foreground">
            ขณะนี้ยังไม่มีช่องทางติดต่อทีมงาน
          </p>
          <p className="text-base">หากมีปัญหากับคำสั่งซื้อ ส่งข้อความหาร้านได้ในหน้าคำสั่งซื้อของคุณ</p>
          <LinkButton href="/orders" variant="secondary" size="xl" className="w-full lg:w-auto">
            ไปที่งานของฉัน
          </LinkButton>
        </div>
      )}
    </AppShell>
  );
}
