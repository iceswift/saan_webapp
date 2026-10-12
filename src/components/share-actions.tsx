"use client";

import { useSyncExternalStore } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const pill =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-foreground/20 px-5 text-base font-medium transition-colors hover:bg-muted active:scale-95 lg:min-h-10";

const noop = () => () => {};
const pageUrl = () => window.location.origin + window.location.pathname;

/**
 * ปุ่มแชร์หน้านี้: "แชร์" ใช้เมนูแชร์ของเครื่อง (navigator.share) ถ้าไม่มีให้คัดลอกลิงก์ + "แชร์ทาง LINE" เป็นลิงก์ธรรมดา (ไม่ใช้ SDK)
 * - title: ชื่อที่ใส่ในข้อความที่แชร์ (เช่น ชื่อศาลหรือชื่อร้าน)
 * - ลิงก์ที่แชร์คือที่อยู่หน้าปัจจุบัน (ไม่รวม query) ไม่ใส่ข้อมูลส่วนตัวหรือตำแหน่งของใคร
 */
export function ShareActions({ title, className }: { title: string; className?: string }) {
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
      <button type="button" onClick={share} className={pill}>
        <Share2 className="size-5" aria-hidden="true" />
        แชร์
      </button>
      <a
        href={`https://line.me/R/share?text=${encodeURIComponent(url ? `${title} ${url}` : title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={pill}
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        แชร์ทาง LINE
      </a>
    </div>
  );
}
