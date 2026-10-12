"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * ขั้นตอนแบบเส้นต่อกัน (หน้าแรก "จากเลือกศาลถึงตรวจรับงาน"): เส้นบนของแต่ละขั้นลากต่อจากขั้นก่อน
 * และตัวเลข/ข้อความสว่างขึ้นทีละขั้นเมื่อส่วนนี้เลื่อนเข้าจอ (IntersectionObserver ครั้งเดียว ไม่มี scroll listener)
 * - ไม่มี JS / ปิดการเคลื่อนไหว / ส่วนที่อยู่ในจอตั้งแต่แรก: แสดงครบสมบูรณ์ทันที (CSS ซ่อนเฉพาะเมื่อ JS ตั้ง data-flow="pending")
 * - CSS: ".flow" ใน globals.css
 */
export function FlowSteps({
  steps,
  className,
}: {
  steps: { title: string; text: string }[];
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    el.dataset.flow = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.flow = "in";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ol
      ref={ref}
      className={cn(
        "flow grid gap-x-6 gap-y-7 [--flow-gap:0rem] sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:[--flow-gap:2rem]",
        className,
      )}
    >
      {steps.map((step, index) => (
        <li key={step.title} className="pt-5" style={{ "--k": index } as React.CSSProperties}>
          <span className="flow-num numeric block font-display text-4xl leading-none font-normal">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="flow-text mt-4 font-display text-xl leading-snug font-medium">{step.title}</p>
          <p className="flow-text mt-1.5 text-base text-muted-foreground">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
