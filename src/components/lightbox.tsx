"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ดูรูปขยายในกล่องกลางจอ (ใช้ Dialog ของระบบ: กด Esc หรือแตะนอกกล่องเพื่อปิด)
 * - urls + index: index เป็น null = ปิด | onIndexChange(null) เมื่อปิด
 * - มีปุ่มก่อนหน้า/ถัดไปและลูกศรซ้าย-ขวาบนคีย์บอร์ดเมื่อมีหลายรูป
 */
export function PhotoViewer({
  urls,
  index,
  onIndexChange,
  alt,
}: {
  urls: string[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  alt: string;
}) {
  const open = index !== null && urls[index] !== undefined;
  const many = urls.length > 1;
  const go = (delta: number) => {
    if (index === null) return;
    onIndexChange((index + delta + urls.length) % urls.length);
  };
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        className="max-h-[92dvh] w-fit max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {index !== null && urls[index] ? (
          <div className="relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[index]}
              alt={alt}
              className="max-h-[85dvh] w-auto max-w-full rounded-lg object-contain"
            />
            {many ? (
              <>
                <button
                  type="button"
                  aria-label="รูปก่อนหน้า"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="รูปถัดไป"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
                <span className="numeric absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1 text-sm">
                  {index + 1}/{urls.length}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
        <DialogClose
          aria-label="ปิดรูป"
          className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-muted"
        >
          <X className="size-5" aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

/**
 * แถวรูปย่อที่แตะแล้วเปิดดูรูปขยาย
 * - variant "thumb": ช่องสี่เหลี่ยมเล็ก (รูปในรีวิว) | "message": รูปใหญ่ในข้อความแชต
 */
export function PhotoThumbs({
  urls,
  alt = "รูปงานจริงจากลูกค้า",
  variant = "thumb",
  className,
}: {
  urls: string[];
  alt?: string;
  variant?: "thumb" | "message";
  className?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  if (urls.length === 0) return null;
  return (
    <>
      <ul className={cn(variant === "thumb" ? "flex flex-wrap gap-2" : "flex flex-col gap-2", className)}>
        {urls.map((url, i) => (
          <li key={url}>
            <button
              type="button"
              aria-label={`${alt} ขยายดูรูปที่ ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "block overflow-hidden rounded-lg border border-border bg-muted transition-opacity hover:opacity-90",
                variant === "thumb" ? "size-16 lg:size-20" : "max-w-full",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alt}
                loading="lazy"
                className={cn(
                  variant === "thumb"
                    ? "size-full object-cover"
                    : "max-h-60 w-auto max-w-full object-cover",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
      <PhotoViewer urls={urls} index={index} onIndexChange={setIndex} alt={alt} />
    </>
  );
}
