"use client";

import { MapPin } from "lucide-react";
import { ShareActions, pillClass } from "@/components/share-actions";
import { SaveButton } from "../saved-products";

/**
 * กลุ่มปุ่มของหน้ารายละเอียดศาล (ใต้รูปหลัก): บันทึก (หัวใจ) · แชร์ · LINE · ดูตำแหน่งร้าน
 * ทุกปุ่มทรงเม็ดยา สูง 44px บนมือถือ ห่อบรรทัดเมื่อแคบ ไม่กระจายอยู่หลายจุดอย่างเดิม
 * หัวใจเป็นองค์ประกอบร่วมของการเปลี่ยนหน้า (วิ่งต่อเนื่องจากหัวใจบนการ์ด)
 * "ดูตำแหน่งร้าน" เลื่อนไปที่แผนที่ (#shop-map) แล้วกางให้ ถ้าร้านนี้ไม่มีพิกัดก็ไม่แสดงปุ่ม
 */
export function ProductActions({
  productId,
  productName,
  shareTitle,
  hasMap,
  className,
}: {
  productId: string;
  productName: string;
  shareTitle: string;
  hasMap: boolean;
  className?: string;
}) {
  function showMap() {
    const root = document.getElementById("shop-map");
    if (!root) return;
    const details = root.querySelector("details");
    if (details && !details.open) details.querySelector("summary")?.click();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  return (
    <ShareActions
      title={shareTitle}
      compact
      className={className}
      leading={<SaveButton productId={productId} productName={productName} pill transition />}
    >
      {hasMap ? (
        <button type="button" onClick={showMap} className={pillClass}>
          <MapPin className="size-5" aria-hidden="true" />
          ดูตำแหน่งร้าน
        </button>
      ) : null}
    </ShareActions>
  );
}
