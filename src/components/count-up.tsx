"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ตัวเลขที่นับขึ้นจาก 0 เมื่อเลื่อนมาเห็น (ใช้กับ StatTile และตัวเลขสรุป)
 * ไม่มี JS หรือผู้ใช้ปิดการเคลื่อนไหว: แสดงค่าจริงทันที ค่าจริงอยู่ใน DOM เสมอเพื่อโปรแกรมอ่านหน้าจอ
 */
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const startedAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(t >= 1 ? null : value * eased);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  const text = (shown ?? value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
