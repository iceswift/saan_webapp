"use client";

import { useCallback, useRef, useState, ViewTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoViewer } from "@/components/lightbox";
import { cn } from "@/lib/utils";

/**
 * ราวรูปสินค้า (หน้ารายละเอียดศาล)
 * - images: รูปจริง 1..n รูป (ตอนนี้ DTO มี imageUrl เดียว จึงส่ง [imageUrl]; พอร้านอัปโหลดหลายรูปได้ก็ใช้ได้ทันที)
 *   ไม่มีรูปจริง = แสดง fallback (ภาพวาดประกอบในกรอบซุ้มโค้ง) ไม่มีราวและไม่มีจุด ไม่ปลอมรูปเพิ่ม
 * - className: ใส่ขนาดและรัศมีซุ้มของกรอบ (เช่น aspect-4/3 [--arch-r:7rem]) กรอบตัดรูปด้วยซุ้มโค้งเหมือนภาพวาด
 * - transitionName: ชื่อองค์ประกอบร่วมของการเปลี่ยนหน้า (รูปบนการ์ด -> กรอบนี้) ทั้งกรณีมีรูปและไม่มีรูป
 *
 * หลายรูป: เลื่อนด้วยนิ้ว (CSS scroll-snap) หรือคีย์บอร์ด (โฟกัสที่ราวแล้วกด ซ้าย/ขวา, Home, End) มีปุ่มจุดใต้รูป (แตะได้ 44px)
 * ปุ่มลูกศรซ้าย/ขวาบนเดสก์ท็อป และตัวเลข "1/3" แตะรูปเพื่อขยายด้วย PhotoViewer (ซ้าย/ขวา และปิดด้วย Esc อยู่ในนั้นแล้ว)
 * ผู้ใช้ปิดการเคลื่อนไหว: เลื่อนทันทีแทนเลื่อนนุ่ม
 */
export function ImageRail({
  images,
  alt,
  fallback,
  transitionName,
  className,
}: {
  images: string[];
  alt: string;
  fallback: React.ReactNode;
  transitionName?: string;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const many = images.length > 1;

  const goTo = useCallback(
    (next: number, instant = false) => {
      const el = scroller.current;
      if (!el) return;
      const target = Math.max(0, Math.min(images.length - 1, next));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: target * el.clientWidth, behavior: instant || reduce ? "auto" : "smooth" });
    },
    [images.length],
  );

  function onScroll() {
    if (raf.current !== null) return;
    raf.current = window.requestAnimationFrame(() => {
      raf.current = null;
      const el = scroller.current;
      if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!many) return;
    if (event.key === "ArrowLeft") goTo(index - 1);
    else if (event.key === "ArrowRight") goTo(index + 1);
    else if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(images.length - 1);
    else return;
    event.preventDefault();
  }

  const frame =
    images.length === 0 ? (
      <div className={cn("overflow-hidden", className)}>{fallback}</div>
    ) : (
      <div className={cn("group/rail arch-top relative overflow-hidden bg-muted", className)}>
        <div
          ref={scroller}
          onScroll={many ? onScroll : undefined}
          onKeyDown={onKeyDown}
          tabIndex={many ? 0 : undefined}
          role={many ? "group" : undefined}
          aria-roledescription={many ? "ภาพหมุน" : undefined}
          aria-label={many ? `รูปของ ${alt} ทั้งหมด ${images.length} รูป ใช้ลูกศรซ้ายขวาเพื่อเลื่อน` : undefined}
          className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-offset-[-3px]"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setViewer(i)}
              aria-label={many ? `ขยายดูรูปที่ ${i + 1} จาก ${images.length}` : `ขยายดูรูป ${alt}`}
              className="relative size-full shrink-0 snap-center cursor-zoom-in"
              tabIndex={many ? -1 : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={i === 0 ? alt : `${alt} รูปที่ ${i + 1}`}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
        {many ? (
          <>
            <span
              aria-hidden="true"
              className="numeric pointer-events-none absolute right-3 bottom-3 rounded-full border border-border bg-background px-3 py-1 text-sm"
            >
              {index + 1}/{images.length}
            </span>
            <button
              type="button"
              aria-label="รูปก่อนหน้า"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background opacity-0 transition-[opacity,background-color] duration-(--dur-fast) group-focus-within/rail:opacity-100 group-hover/rail:opacity-100 hover:bg-muted disabled:hidden max-lg:hidden"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="รูปถัดไป"
              onClick={() => goTo(index + 1)}
              disabled={index === images.length - 1}
              className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background opacity-0 transition-[opacity,background-color] duration-(--dur-fast) group-focus-within/rail:opacity-100 group-hover/rail:opacity-100 hover:bg-muted disabled:hidden max-lg:hidden"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset"
        />
      </div>
    );

  return (
    <div>
      {transitionName ? (
        <ViewTransition name={transitionName} share="morph-image" default="none">
          {frame}
        </ViewTransition>
      ) : (
        frame
      )}
      {many ? (
        <div role="group" aria-label="เลือกรูป" className="mt-1 flex items-center justify-center">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`ไปรูปที่ ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className="rail-dot flex h-11 w-7 items-center justify-center"
            >
              <span
                className={cn("h-2 rounded-full", i === index ? "w-5 bg-foreground" : "w-2 bg-input")}
              />
            </button>
          ))}
        </div>
      ) : null}
      <PhotoViewer
        urls={images}
        index={viewer}
        onIndexChange={(next) => {
          setViewer(next);
          if (next !== null) goTo(next, true);
        }}
        alt={alt}
      />
    </div>
  );
}
