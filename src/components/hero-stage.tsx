"use client";

import { useEffect, useRef } from "react";

/**
 * กรอบของภาพเด่นหน้าแรก ทำสองอย่างเล็ก ๆ (ไม่มี scroll listener):
 * 1) ขนานตามเมาส์: เฉพาะเดสก์ท็อปที่มีเมาส์จริง ((hover: hover) + (pointer: fine) + กว้างตั้งแต่ lg) และผู้ใช้ไม่ได้ปิดการเคลื่อนไหว
 *    ตั้งตัวแปร --px / --py (-1 ถึง 1) ผ่าน requestAnimationFrame หนึ่งครั้งต่อเฟรม แต่ละชั้นของภาพ (hero-l1..l5 ใน globals.css) ขยับตามตัวแปรนี้
 * 2) พักการวนของรายละเอียดเล็ก (ควันธูป พวงมาลัย) เมื่อกรอบพ้นจอ: ตั้ง data-paused="true" ให้ CSS หยุด animation
 * ไม่มี JavaScript = ภาพนิ่งปกติ ไม่เสียอะไร
 */
export function HeroStage({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) delete el.dataset.paused;
        else el.dataset.paused = "true";
      });
      observer.observe(el);
    }

    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let nx = 0;
    let ny = 0;
    let attached = false;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--px", nx.toFixed(3));
      el.style.setProperty("--py", ny.toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      nx = (event.clientX / window.innerWidth - 0.5) * 2;
      ny = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const sync = () => {
      const want = fine.matches && !reduce.matches;
      if (want && !attached) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        attached = true;
      } else if (!want && attached) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        attached = false;
        onLeave();
      }
    };
    sync();
    fine.addEventListener("change", sync);
    reduce.addEventListener("change", sync);

    return () => {
      observer?.disconnect();
      fine.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
