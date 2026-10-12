"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { SectionTitle } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/visuals";
import { FAQ } from "./faq-data";

/** คำถามที่พบบ่อย กรองคำถามและคำตอบจากช่องค้นหาในหน้า (ไม่เรียกเซิร์ฟเวอร์) แสดงเป็นรายการพับได้กลุ่มเดียว */
export function FaqSearch() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const items = q
    ? FAQ.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(q))
    : FAQ;

  return (
    <section>
      <SectionTitle>คำถามที่พบบ่อย</SectionTitle>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="ค้นหาคำถาม"
          placeholder="ค้นหา เช่น มัดจำ ยกเลิก"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState art="search" title="ไม่พบคำถามที่ตรงกัน" description="ลองใช้คำอื่น" />
      ) : (
        <ul className="surface mt-4 flex flex-col divide-y divide-border overflow-hidden">
          {items.map((item) => (
            <li key={`${q ? "q" : "all"}-${item.question}`}>
              <details open={q ? true : undefined} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 px-4 py-3 transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 text-base leading-snug font-medium">{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="max-w-[70ch] px-4 pb-4 text-base text-muted-foreground">{item.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
