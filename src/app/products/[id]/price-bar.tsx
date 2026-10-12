"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/link-button";
import { ThumbArt } from "@/components/thumb-art";
import type { ShrineKind } from "@/lib/constants";
import { formatBaht } from "@/lib/format";

/**
 * แถบราคาติดใต้ส่วนหัวเว็บ (เดสก์ท็อปเท่านั้น): ชื่อศาล · ราคา · ปุ่มหลักตัวเดียวกับในแผงสั่งซื้อ
 * โผล่เมื่อปุ่มหลักในแผงสั่งซื้อ (#targetId) เห็นไม่ครบหรือหลุดจากหน้าจอ เช่น แผงสูงกว่าหน้าต่างเพราะตัวอักษรใหญ่หรือจอเตี้ย
 * และหายเองเมื่อปุ่มในแผงกลับมาเห็น (จึงไม่มีปุ่มสีชาดสองปุ่มพร้อมกัน)
 * ตอนซ่อน: inert + aria-hidden (ไม่รับโฟกัส ไม่อยู่ในต้นไม้การเข้าถึง) มือถือใช้แถบปุ่มล่างเดิม
 * ใช้ IntersectionObserver (ไม่ฟัง scroll) ขอบบนหัก 84px ให้เท่าเกาะส่วนหัว เลื่อนเข้า/ออกด้วยโทเคนเวลาเดิม (.price-bar)
 */
export function PriceBar({
  targetId,
  name,
  kind,
  imageUrl,
  price,
  href,
}: {
  targetId: string;
  name: string;
  kind: ShrineKind;
  imageUrl: string | null;
  price: number;
  href: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    // "เห็นปุ่มครบ" = สัดส่วนที่เห็น >= 0.99 (ปุ่มโผล่แค่ขอบก็ยังกดไม่สะดวก จึงให้แถบช่วย)
    const io = new IntersectionObserver(([entry]) => setShow(entry.intersectionRatio < 0.99), {
      rootMargin: "-84px 0px 0px 0px",
      threshold: [0, 0.5, 0.99, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--site-header-h)-0.25rem)] z-20 flex justify-center max-lg:hidden">
      <div
        role="region"
        aria-label="สรุปราคาและสั่งซื้อ"
        data-price-bar=""
        data-show={show}
        aria-hidden={!show}
        inert={!show}
        className="price-bar flex w-[min(100%-2rem,44rem)] items-center gap-4 rounded-full border border-border bg-card py-2 pr-2 pl-2"
      >
        <ThumbArt kind={kind} src={imageUrl} size="sm" className="size-12 rounded-full" />
        <p className="min-w-0 flex-1 truncate text-base font-medium">{name}</p>
        <LinkButton href={href} variant="gold" className="numeric shrink-0">
          สั่งตั้งศาล · {formatBaht(price)}
        </LinkButton>
      </div>
    </div>
  );
}
