"use client";

import { useEffect, useRef, useState } from "react";
import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";
import { priceNumberClass, type priceSizes } from "./price";

/**
 * ราคาที่ "วิ่งตัวเลข" เมื่อค่าเปลี่ยน (400ms ease-out) ใช้กับยอดรวมที่เปลี่ยนตามตัวเลือก เช่น แพ็กเกจ ของไหว้ วันนัด
 * ครั้งแรกที่แสดงไม่วิ่ง (ค่าจริงอยู่ใน DOM ทันที) ผู้ใช้ที่ปิดการเคลื่อนไหวเห็นค่าใหม่ทันที
 * ตัวอ่านหน้าจอได้ค่าจริงเสมอ (ตัวเลขที่วิ่งเป็น aria-hidden)
 */
export function PriceTicker({
  amount,
  size = "lg",
  emphasis = false,
  duration = 400,
  className,
}: {
  amount: number;
  size?: keyof typeof priceSizes;
  emphasis?: boolean;
  duration?: number;
  className?: string;
}) {
  // ระหว่างวิ่ง: ค่าที่แสดงอยู่ (null = แสดงค่าจริงตรง ๆ)
  const [running, setRunning] = useState<number | null>(null);
  const shownRef = useRef(amount);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    if (from === amount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = amount;
      return;
    }
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = t >= 1 ? amount : Math.round(from + (amount - from) * eased);
      shownRef.current = value;
      setRunning(t >= 1 ? null : value);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [amount, duration]);

  return (
    <span className={cn(priceNumberClass(size, emphasis), className)}>
      <span className="sr-only">{formatBaht(amount)}</span>
      <span aria-hidden="true">{formatBaht(running ?? amount)}</span>
    </span>
  );
}
