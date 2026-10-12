"use client";

import { ViewTransition } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * โครงรอโหลดที่เป็น "ปลายทาง" ขององค์ประกอบร่วมของการเปลี่ยนหน้า (v6.2)
 * เมื่อกดการ์ด หน้าใหม่แสดงโครงรอโหลดก่อน (loading.tsx) แล้วเนื้อหาจริงค่อยตามมา
 * ถ้าโครงรอโหลดไม่มีชื่อ view-transition เดียวกับรูปบนการ์ด รูปจะไม่มีคู่ให้เลื่อนไปหา
 * จึงให้โครงนี้ใช้ชื่อ `${prefix}-${params[param]}` (เช่น product-<id>) เหมือนที่การ์ดและหน้าจริงใช้
 * - share: ชื่อคลาสของการเปลี่ยน (morph-image = รูปใหญ่, morph-mark = โลโก้ตัวอักษร/หัวใจชิ้นเล็ก)
 */
export function SharedSkeleton({
  prefix,
  param = "id",
  share = "morph-image",
  className,
}: {
  prefix: string;
  param?: string;
  share?: "morph-image" | "morph-mark";
  className?: string;
}) {
  const params = useParams<Record<string, string>>();
  const id = params?.[param];
  const skeleton = <Skeleton className={className} />;
  if (!id) return skeleton;
  return (
    <ViewTransition name={`${prefix}-${id}`} share={share} default="none">
      {skeleton}
    </ViewTransition>
  );
}
