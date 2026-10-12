"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** ป้ายเล็ก "เร็ว ๆ นี้" วางข้างชื่อฟีเจอร์ที่ยังไม่เปิดใช้ */
export function SoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-full bg-muted px-2.5 text-sm leading-none font-medium whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      เร็ว ๆ นี้
    </span>
  );
}

/**
 * ปุ่มของฟีเจอร์ที่ยังไม่มีระบบหลังบ้าน: หน้าตาเป็นปุ่มปกติ มีป้าย "เร็ว ๆ นี้"
 * กดแล้วบอกตรง ๆ ว่ายังไม่เปิดใช้ ไม่ทำเป็นว่าทำงานได้
 */
export function SoonButton({
  children,
  message = "ฟีเจอร์นี้กำลังจะเปิดใช้ ขอบคุณที่รอ",
  variant = "outline",
  className,
}: {
  children: React.ReactNode;
  message?: string;
  variant?: "outline" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="xl"
      variant={variant}
      aria-disabled="true"
      className={cn("opacity-90", className)}
      onClick={() => toast.info(message)}
    >
      {children}
      <SoonBadge className="ml-1" />
    </Button>
  );
}
