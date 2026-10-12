import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { GUIDE_ARTICLES, getGuide, readingMinutes } from "../content";
import { GuideCover } from "../cover";

export async function generateMetadata({ params }: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuide(slug);
  return { title: article ? article.title : "คู่มือ" };
}

export default async function GuideArticlePage({ params }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const article = getGuide(slug);
  if (!article) notFound();

  const others = GUIDE_ARTICLES.filter((a) => a.slug !== article.slug);
  const hasToc = article.sections.length >= 3;

  return (
    <AppShell
      footer={
        <LinkButton href={article.cta.href} variant="gold" className="w-full">
          {article.cta.label}
        </LinkButton>
      }
    >
      <PageHeader title={article.title} backHref="/guide" backLabel="คู่มือ" />

      <Rise>
        <GuideCover article={article} className="aspect-[16/9] w-full lg:aspect-[2/1]" artClassName="h-[85%]" />
        <p className="mt-4 text-lg text-muted-foreground">{article.summary}</p>
        <p className="mt-1 text-sm text-muted-foreground">อ่านประมาณ {readingMinutes(article)} นาที</p>
      </Rise>

      {hasToc ? (
        <nav aria-label="ในบทความนี้" className="mt-8">
          <ol className="divide-y divide-border border-y border-border">
            {article.sections.map((section, i) => (
              <li key={section.heading}>
                <a
                  href={`#part-${i + 1}`}
                  className="flex min-h-11 items-baseline gap-4 py-3 text-base transition-colors hover:text-foreground"
                >
                  <span className="numeric w-6 shrink-0 text-muted-foreground">{i + 1}</span>
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <article className="mt-10 flex flex-col gap-10 lg:mt-14 lg:gap-14">
        {article.sections.map((section, i) => (
          <section
            key={section.heading}
            id={`part-${i + 1}`}
            className="scroll-mt-6 lg:scroll-mt-[calc(var(--site-header-h)+1.5rem)]"
          >
            <h2 className="flex items-baseline gap-4 font-display text-xl leading-snug font-medium lg:text-2xl">
              <span className="numeric w-6 shrink-0 text-base font-normal text-muted-foreground">{i + 1}</span>
              {section.heading}
            </h2>
            <div className="mt-3 flex flex-col gap-3 pl-10">
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-[1.0625rem] leading-8">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="divide-y divide-border border-y border-border">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="py-3 text-base leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </article>

      <p className="mt-12 border-t border-border pt-5 text-sm text-muted-foreground">
        ธรรมเนียมแตกต่างกันตามท้องถิ่นและสายครู ข้อมูลนี้เป็นแนวทางทั่วไป ควรปรึกษาผู้ประกอบพิธีก่อนตัดสินใจ
      </p>

      {others.length > 0 ? (
        <>
          <SectionTitle>อ่านต่อ</SectionTitle>
          <ListGroup label="บทความอื่น">
            {others.map((other) => (
              <ListRow key={other.slug} href={`/guide/${other.slug}`} title={other.title} meta={other.summary} />
            ))}
          </ListGroup>
        </>
      ) : null}
    </AppShell>
  );
}
