import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Reveal } from "@/components/reveal";
import { GUIDE_ARTICLES, readingMinutes } from "./content";
import { GuideCover } from "./cover";

export const metadata: Metadata = { title: "คู่มือ" };

export default function GuidePage() {
  return (
    <AppShell>
      <PageHeader title="คู่มือ" backHref="/" backLabel="หน้าแรก" />

      <ul className="divide-y divide-border border-y border-border">
        {GUIDE_ARTICLES.map((article, i) => (
          <Reveal as="li" key={article.slug} i={i % 4}>
            <Link
              href={`/guide/${article.slug}`}
              className="group/row -mx-3 flex items-center gap-4 rounded-lg px-3 py-6 transition-colors hover:bg-muted lg:gap-8"
            >
              <span className="numeric hidden w-8 shrink-0 text-base text-muted-foreground sm:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl leading-snug font-normal text-balance lg:text-2xl">
                  {article.title}
                </span>
                <span className="mt-1 block text-base text-muted-foreground">{article.summary}</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  อ่านประมาณ {readingMinutes(article)} นาที
                </span>
              </span>
              <GuideCover article={article} className="size-24 shrink-0 lg:size-32" artClassName="size-[85%]" />
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 max-sm:hidden"
              />
            </Link>
          </Reveal>
        ))}
      </ul>
    </AppShell>
  );
}
