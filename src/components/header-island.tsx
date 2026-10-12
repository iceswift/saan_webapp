"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * ตัวห่อส่วนหัวแบบ "เกาะลอย" (เดสก์ท็อป lg ขึ้นไป)
 * - ชั้นนอก (header) สูงเท่า --site-header-h และติดขอบบน จองที่ไว้เสมอ เนื้อหาหน้าจึงไม่กระโดดตอนเกาะหดตัว
 * - ชั้นใน (.site-island) คือเกาะจริง ลอยห่างขอบบน 0.75rem ผิวกึ่งโปร่งเบลอ (ข้อยกเว้นข้อเดียวของกฎ "ไม่เบลอ")
 * - เลื่อนลงเกิน ~24px: ใส่ data-scrolled ที่เกาะ (CSS ทำให้หดสูง 4.5rem -> 3.75rem และซ่อนคำว่า Saan)
 *   ตรวจด้วย IntersectionObserver บนจุดอ้างอิงที่ขอบบนเอกสาร ไม่ฟัง scroll และไม่ re-render
 */
export function HeaderIsland({ children }: { children: React.ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const island = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      island.current?.toggleAttribute("data-scrolled", !entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        ref={sentinel}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-6 w-px max-lg:hidden"
      />
      <header className="pointer-events-none sticky top-0 z-30 hidden h-(--site-header-h) lg:block">
        <div
          ref={island}
          className="site-island group/island pointer-events-auto mx-auto mt-3 flex h-[4.5rem] w-[min(100%-2rem,80rem)] items-center gap-2 rounded-full border border-border px-3 transition-[height] duration-(--dur-base) ease-soft data-scrolled:h-[3.75rem] xl:gap-3 xl:px-4"
        >
          {children}
        </div>
      </header>
    </>
  );
}

/**
 * เส้นความคืบหน้าบาง ๆ (สีชาด 2px) ที่ขอบบนจอ ระหว่างรอเปลี่ยนหน้า
 * เริ่มเมื่อคลิกลิงก์ภายในที่ไปคนละ path จบเมื่อ pathname เปลี่ยน (หรือครบ 8 วินาที) ไม่ผูกกับ API ภายในของ Next
 */
export function NavProgress() {
  const pathname = usePathname();
  // from = path ที่เริ่มคลิกออกมา (null = ไม่มีงานค้าง) finished = ครบเวลาแล้วแต่หน้ายังไม่เปลี่ยน
  const [run, setRun] = useState<{ from: string | null; finished: boolean }>({ from: null, finished: false });
  const current = useRef(pathname);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    current.current = pathname;
  }, [pathname]);

  const phase: "idle" | "loading" | "done" =
    run.from === null ? "idle" : run.finished || run.from !== pathname ? "done" : "loading";

  useEffect(() => {
    if (phase !== "done") return;
    const t = window.setTimeout(() => setRun({ from: null, finished: false }), 500);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === current.current) return;
      setRun({ from: current.current, finished: false });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setRun((r) => ({ ...r, finished: true })), 8000);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[60] h-0.5 w-full origin-left bg-gold"
      style={
        phase === "loading"
          ? { opacity: 1, transform: "scaleX(0.85)", transition: "transform 8s cubic-bezier(0.1, 0.6, 0.2, 1)" }
          : phase === "done"
            ? { opacity: 0, transform: "scaleX(1)", transition: "transform 200ms var(--ease-out), opacity 300ms ease 180ms" }
            : { opacity: 0, transform: "scaleX(0)", transition: "none" }
      }
    />
  );
}
