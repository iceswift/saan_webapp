"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/** คุกกี้ของเซสชันนี้ (หายเมื่อปิดเบราว์เซอร์) บอกว่าแผงเด่นหน้าแรกเล่นฉากเปิดไปแล้ว หน้าแรกอ่านค่านี้ฝั่งเซิร์ฟเวอร์ด้วย */
export const HERO_SEEN_COOKIE = "saan_hero_seen";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readSeen(): boolean {
  try {
    return document.cookie.split("; ").some((c) => c === `${HERO_SEEN_COOKIE}=1`);
  } catch {
    return false;
  }
}

/**
 * แผงเด่นหน้าแรก (<section>) ที่คุมฉากเปิดแบบเล่นครั้งเดียวต่อเซสชัน
 * - CSS ของฉากเปิดอยู่ใน globals.css ภายใต้ [data-hero]:not([data-seen]) เท่านั้น
 *   ค่าเริ่มต้นของหน้า (ไม่มี JS / ผู้ใช้ปิดการเคลื่อนไหว / data-seen) คือสภาพสุดท้ายที่ครบถ้วน
 * - seen (จากคุกกี้ ฝั่งเซิร์ฟเวอร์) ทำให้ HTML ออกมามี data-seen ตั้งแต่แรก จึงไม่กระตุกตอนโหลดซ้ำ
 * - ย้อนกลับมาหน้าแรกด้วยปุ่มย้อน (React ใช้ข้อมูลเดิมที่เก็บไว้) layout effect จะตั้ง data-seen ก่อนวาดภาพ จึงไม่เล่นซ้ำ
 * - ตั้งคุกกี้หลังฉากเปิดจบ (1.4 วินาที) ถ้าผู้ใช้ออกจากหน้าก่อนนั้น ฉากเปิดจะเล่นอีกรอบ
 */
export function HeroIntro({
  className,
  seen = false,
  children,
}: {
  className?: string;
  seen?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    if (readSeen()) ref.current?.setAttribute("data-seen", "true");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        document.cookie = `${HERO_SEEN_COOKIE}=1; path=/; SameSite=Lax`;
      } catch {
        /* ไม่มีคุกกี้ก็แค่เล่นฉากเปิดอีกครั้ง */
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section ref={ref} data-hero="" data-seen={seen ? "true" : undefined} className={className}>
      {children}
    </section>
  );
}
