"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Price } from "@/components/price";
import { ShrineImage } from "@/components/visuals";
import { cn } from "@/lib/utils";

// ศาลที่บันทึกไว้เก็บในเครื่องนี้ (localStorage) ยังไม่ผูกกับบัญชี
const KEY = "saan_saved_products";
const EMPTY = "[]";
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return window.localStorage.getItem(KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function parseIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** รหัสศาลที่บันทึกไว้ในเครื่องนี้ (ฝั่งเซิร์ฟเวอร์เป็นรายการว่างเสมอ) */
export function useSavedIds(): string[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  return useMemo(() => parseIds(raw), [raw]);
}

function toggleSaved(id: string): boolean {
  const current = parseIds(readRaw());
  const nowSaved = !current.includes(id);
  const next = nowSaved ? [id, ...current].slice(0, 50) : current.filter((x) => x !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    toast.error("เครื่องนี้บันทึกไม่ได้ ลองใหม่อีกครั้ง");
    return !nowSaved;
  }
  listeners.forEach((l) => l());
  return nowSaved;
}

/** จุดสีชาดหกจุดของ burst: ทิศคงที่ทุก 60 องศา ระยะ 19px (ไม่ใช้ตรีโกณใน CSS เพื่อให้ทุกเบราว์เซอร์เหมือนกัน) */
const BURST = [
  [19, 0],
  [9.5, 16.5],
  [-9.5, 16.5],
  [-19, 0],
  [-9.5, -16.5],
  [9.5, -16.5],
] as const;

/**
 * ปุ่มหัวใจบันทึกศาล overlay = ปุ่มลอยบนรูป
 * กดแล้วหัวใจเติมสีทันที (อ่านจาก localStorage ผ่าน useSyncExternalStore ที่แจ้งเปลี่ยนแบบซิงก์ จึงเป็น optimistic อยู่แล้ว)
 * หัวใจเด้ง (animate-pop) และมีจุดสีชาดกระจายออกหกจุด (.heart-burst, 400ms) เฉพาะตอนกดบันทึก ไม่ใช่ตอนหน้าโหลดมาพร้อมค่าเดิม
 * ไม่มี toast ตอนสำเร็จ: ยืนยันด้วย aria-pressed + ข้อความใน live region (sr-only) เท่านั้น ส่วนเก็บไม่ได้ยังขึ้น toast ผิดพลาด
 */
export function SaveButton({
  productId,
  productName,
  overlay = false,
  className,
}: {
  productId: string;
  productName: string;
  overlay?: boolean;
  className?: string;
}) {
  const saved = useSavedIds().includes(productId);
  // เด้งและกระจายจุดเฉพาะตอนผู้ใช้กดบันทึก (นับครั้งเพื่อให้ key เปลี่ยนและเล่นซ้ำได้)
  const [popped, setPopped] = useState(false);
  const [burst, setBurst] = useState(0);
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `เอา ${productName} ออกจากที่บันทึกไว้` : `บันทึก ${productName}`}
        onClick={() => {
          const nowSaved = toggleSaved(productId);
          setPopped(nowSaved);
          if (nowSaved) setBurst((n) => n + 1);
          setMessage(nowSaved ? "บันทึกศาลไว้แล้ว" : "เอาออกจากที่บันทึกไว้แล้ว");
        }}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-full transition-[transform,background-color] active:scale-90",
          overlay ? "glass" : "bg-card hover:bg-muted",
          className,
        )}
      >
        <Heart
          aria-hidden="true"
          className={cn(
            "size-5 transition-colors duration-200",
            saved ? "fill-gold text-gold" : "text-foreground",
            saved && popped && "animate-pop",
          )}
        />
        {burst > 0 && saved ? (
          <span key={burst} aria-hidden="true" className="heart-burst">
            {BURST.map(([x, y], i) => (
              <i key={i} style={{ "--bx": x, "--by": y } as React.CSSProperties} />
            ))}
          </span>
        ) : null}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
    </>
  );
}

/** แชร์ลิงก์ด้วยเมนูแชร์ของเครื่อง ถ้าไม่มีให้คัดลอกลิงก์แทน */
export function ShareButton({
  title,
  overlay = false,
  className,
}: {
  title: string;
  overlay?: boolean;
  className?: string;
}) {
  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("คัดลอกลิงก์แล้ว");
    } catch {
      toast.error("คัดลอกลิงก์ไม่ได้ ลองคัดลอกจากแถบที่อยู่");
    }
  }

  return (
    <button
      type="button"
      aria-label="แชร์ศาลนี้"
      onClick={share}
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-[transform,background-color] active:scale-90",
        overlay ? "glass" : "bg-card hover:bg-muted",
        className,
      )}
    >
      <Share2 aria-hidden="true" className="size-5" />
    </button>
  );
}

type SavedItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  providerName: string;
};

/** ศาลที่ผู้ใช้บันทึกไว้ในเครื่องนี้ มือถือเป็นแถวเลื่อนแนวนอน เดสก์ท็อปเป็นกริด ไม่แสดงเมื่อยังไม่เคยบันทึก */
export function SavedRow({ items }: { items: SavedItem[] }) {
  const ids = useSavedIds();
  const saved = ids.flatMap((id) => items.filter((item) => item.id === id));
  if (saved.length === 0) return null;

  return (
    <section>
      <div className="mt-8 mb-4 lg:mt-0">
        <p className="eyebrow">เก็บไว้ดูทีหลัง</p>
        <h2 className="flex items-center gap-2 text-xl leading-snug font-medium">
          ศาลที่บันทึกไว้
          <span className="numeric inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-2 text-sm font-medium text-foreground">
            {saved.length}
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">บันทึกไว้ในเครื่องนี้เท่านั้น</p>
      </div>
      <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pt-1 pb-3 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:mb-6 lg:grid lg:snap-none lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0 xl:grid-cols-4">
        {saved.map((item) => (
          <li key={item.id} className="w-40 shrink-0 snap-start lg:w-auto">
            <Link
              href={`/products/${item.id}`}
              className="flex h-full flex-col gap-2 surface p-3 transition-colors hover:bg-muted"
            >
              <ShrineImage src={item.imageUrl} alt={item.name} className="aspect-square w-full" />
              <span className="line-clamp-2 min-h-[3.2em] text-base leading-snug font-medium">
                {item.name}
              </span>
              <Price amount={item.price} size="sm" />
              <span className="truncate text-sm text-muted-foreground">{item.providerName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** เครื่องหมายถูกเล็ก ใช้ในรายการ "รวมอะไรบ้าง" */
export function CheckDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full bg-tint-mint text-tint-mint-ink",
        className,
      )}
    >
      <Check className="size-3.5" strokeWidth={2.8} />
    </span>
  );
}
