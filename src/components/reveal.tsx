"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * โผล่ขึ้นเบา ๆ เมื่อเลื่อนมาถึง (ใช้กับส่วนที่อยู่ต่ำกว่าจอแรก; ส่วนบนสุดของหน้าใช้ <Rise>)
 * - ไม่มี JavaScript หรือผู้ใช้ปิดการเคลื่อนไหว: เห็นเนื้อหาปกติทันที
 * - ส่วนที่อยู่ในจอตั้งแต่แรกจะไม่ถูกซ่อน (กันกระพริบ)
 * - i = ลำดับในกลุ่ม หน่วงทีละ 70ms (ใช้ i={index % 4} กับรายการยาว)
 */
export function Reveal({
  as: Tag = "div",
  i = 0,
  className,
  children,
}: {
  as?: "div" | "li" | "section" | "article";
  i?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const Component = Tag as React.ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.reveal = "in";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Component ref={ref} className={cn(className)} style={{ "--i": i } as React.CSSProperties}>
      {children}
    </Component>
  );
}
