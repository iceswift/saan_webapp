"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * วาบพื้นหลัง bg-muted จางหาย 600ms เมื่อ value เปลี่ยน (หรือเมื่อโผล่มาถ้า onMount) ใช้กับแถวสรุปยอดที่เปลี่ยนตามตัวเลือก
 * ใช้ Web Animations API จึงเริ่มซ้ำได้ทุกครั้งโดยไม่ remount ลูก (PriceTicker ข้างในยังวิ่งตัวเลขต่อเนื่อง)
 * ผู้ใช้ที่ปิดการเคลื่อนไหวไม่เห็นอะไรเลย และค่าที่แสดงถูกต้องเสมอ
 */
export function FlashOnChange({
  value,
  onMount = false,
  className,
  children,
}: {
  value?: string | number;
  onMount?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (isFirst && !onMount) return;
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = el.animate(
      [{ backgroundColor: "var(--muted)" }, { backgroundColor: "transparent" }],
      { duration: 600, easing: "cubic-bezier(0.22, 0.8, 0.24, 1)" },
    );
    return () => animation.cancel();
  }, [value, onMount]);

  return (
    <div ref={ref} className={cn("rounded-lg", className)}>
      {children}
    </div>
  );
}
