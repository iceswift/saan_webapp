"use client";

import { useSyncExternalStore } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const pillClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-foreground/20 px-5 text-base font-medium transition-colors hover:bg-muted active:scale-95 lg:min-h-10";

const noop = () => () => {};
const pageUrl = () => window.location.origin + window.location.pathname;

/**
 * ปุ่มแชร์หน้านี้: "แชร์" ใช้เมนูแชร์ของเครื่อง (navigator.share) ถ้าไม่มีให้คัดลอกลิงก์ + "แชร์ทาง LINE" เป็นลิงก์ธรรมดา (ไม่ใช้ SDK)
 * - title: ชื่อที่ใส่ในข้อความที่แชร์ (เช่น ชื่อศาลหรือชื่อร้าน)
 * - ลิงก์ที่แชร์คือที่อยู่หน้าปัจจุบัน (ไม่รวม query) ไม่ใส่ข้อมูลส่วนตัวหรือตำแหน่งของใคร
 */
export function ShareActions({
  title,
  className,
  leading,
  compact = false,
  children,
}: {
  title: string;
  className?: string;
  /** ปุ่มที่ต่อหน้าปุ่มแชร์ในแถวเดียวกัน (เช่น บันทึก) */
  leading?: React.ReactNode;
  /** true = ปุ่ม LINE เหลือคำว่า "LINE" (ชื่อเต็มอยู่ใน aria-label) ให้กลุ่มปุ่มสั้นลงบนมือถือ */
  compact?: boolean;
  /** ปุ่มที่ต่อท้ายในแถวเดียวกัน (เช่น ดูตำแหน่งร้าน) */
  children?: React.ReactNode;
}) {
  // ฝั่งเซิร์ฟเวอร์ยังไม่รู้โดเมน จึงเป็นข้อความว่างก่อนแล้วเติมหลังโหลดหน้า
  const url = useSyncExternalStore(noop, pageUrl, () => "");

  async function share() {
    const link = pageUrl();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: link });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success("คัดลอกลิงก์แล้ว");
    } catch {
      toast.error("คัดลอกลิงก์ไม่ได้ ลองคัดลอกจากแถบที่อยู่");
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {leading}
      <button type="button" onClick={share} className={pillClass}>
        <Share2 className="size-5" aria-hidden="true" />
        แชร์
      </button>
      <a
        href={`https://line.me/R/share?text=${encodeURIComponent(url ? `${title} ${url}` : title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={compact ? "แชร์ทาง LINE" : undefined}
        className={pillClass}
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        {compact ? "LINE" : "แชร์ทาง LINE"}
      </a>
      {children}
    </div>
  );
}
