import { AppShell, PageHeader } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { Notice } from "@/components/notice";
import { Rise } from "@/components/rise";
import { TriangleAlert } from "lucide-react";

export type LegalSection = {
  heading: string;
  paragraphs?: React.ReactNode[];
  items?: string[];
};

/** โครงเอกสารกฎหมายแบบอ่านง่าย มีประกาศฉบับร่างด้านบนเสมอ พร้อมสารบัญและลิงก์ไปเอกสารอีกฉบับ */
export function LegalDoc({
  title,
  sections,
  other,
}: {
  title: string;
  sections: LegalSection[];
  /** เอกสารอีกฉบับสำหรับอ่านต่อ */
  other: { href: string; title: string };
}) {
  return (
    <AppShell>
      <PageHeader title={title} backHref="/help" backLabel="ช่วยเหลือ" />

      <Rise>
        <Notice tone="amber" icon={TriangleAlert}>
          <p className="text-base font-medium">ฉบับร่าง รอการตรวจทานทางกฎหมายก่อนเปิดใช้จริง</p>
        </Notice>
      </Rise>

      <nav aria-label="สารบัญ" className="mt-8">
        <ol className="divide-y divide-border border-y border-border">
          {sections.map((section, i) => (
            <li key={section.heading}>
              <a
                href={`#section-${i + 1}`}
                className="flex min-h-11 items-baseline gap-4 py-3 text-base transition-colors hover:text-foreground"
              >
                <span className="numeric w-6 shrink-0 text-muted-foreground">{i + 1}</span>
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="mt-10 flex flex-col gap-10 lg:mt-14 lg:gap-14">
        {sections.map((section, i) => (
          <section
            key={section.heading}
            id={`section-${i + 1}`}
            className="scroll-mt-6 lg:scroll-mt-[calc(var(--site-header-h)+1.5rem)]"
          >
            <h2 className="flex items-baseline gap-4 font-display text-xl leading-snug font-medium lg:text-2xl">
              <span className="numeric w-6 shrink-0 text-base font-normal text-muted-foreground">{i + 1}</span>
              {section.heading}
            </h2>
            <div className="mt-3 flex flex-col gap-3 pl-10">
              {section.paragraphs?.map((p, pi) => (
                <p key={pi} className="text-base leading-relaxed">
                  {p}
                </p>
              ))}
              {section.items ? (
                <ul className="divide-y divide-border border-y border-border">
                  {section.items.map((item) => (
                    <li key={item} className="py-3 text-base leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </article>

      <ListGroup className="mt-12" label="อ่านต่อ">
        <ListRow href={other.href} title={other.title} meta="อ่านต่อ" />
      </ListGroup>
    </AppShell>
  );
}
