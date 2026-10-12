"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * แถวพับ "ปักหมุดที่ตั้ง (ไม่บังคับ)" ที่กางออกเป็นแผนที่ ทำให้ฟอร์มสั้น
 * - children (เช่น <LocationPicker/>) ถูกสร้างเมื่อกางเท่านั้น (ไม่โหลดแผนที่ถ้าไม่เปิด) และถูกถอดเมื่อพับ ค่าหมุดอยู่ใน state ของฟอร์ม จึงไม่หาย
 * - hasPin: แสดง "ปักหมุดแล้ว" ที่หัวแถว | defaultOpen: กางตั้งแต่แรก
 * - ใช้ <details> จึงมีแอนิเมชันเลื่อนความสูงจาก globals.css อยู่แล้ว
 */
export function ExpandableMap({
  children,
  hasPin = false,
  title = "ปักหมุดที่ตั้ง (ไม่บังคับ)",
  hint = "ช่วยให้ร้านหาที่ได้ง่ายขึ้น",
  defaultOpen = false,
  className,
}: {
  children: React.ReactNode;
  hasPin?: boolean;
  title?: string;
  hint?: string;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={cn("surface group/map overflow-hidden", className)}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
        <MapPin className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">{title}</span>
          <span className="block text-sm text-muted-foreground">
            {hasPin ? "ปักหมุดแล้ว" : hint}
          </span>
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open/map:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-4 pt-1 pb-4">{open ? children : null}</div>
    </details>
  );
}
