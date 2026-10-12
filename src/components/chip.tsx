import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** คลาสของชิป ใช้เองได้ถ้าต้องการ <button> หรือ <label> ที่หน้าตาเหมือนชิป */
export function chipClass(active: boolean) {
  return cn(
    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-base font-medium whitespace-nowrap transition-[background-color,color,transform] duration-200 active:scale-95",
    active
      ? "border border-primary bg-primary text-primary-foreground"
      : "border border-foreground/20 bg-background text-foreground hover:bg-muted",
  );
}

/**
 * แถวชิป: มือถือเลื่อนแนวนอนชิดขอบจอ เดสก์ท็อป (lg) ขึ้นบรรทัดใหม่ได้ ไม่ต้องเลื่อน
 * ใช้ห่อ <Chip> ที่เรียงเป็นแถวเสมอ แทนการเขียน `-mx-5 flex overflow-x-auto px-5` เอง
 */
export function ChipRow({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  /** ชื่อกลุ่มสำหรับโปรแกรมอ่านหน้าจอ เช่น "ประเภทศาล" */
  label?: string;
}) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(
        "-mx-5 flex gap-2 overflow-x-auto px-5 pt-0.5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * ชิปตัวกรอง/ตัวเลือกสั้น ๆ วางใน <ChipRow>
 * ใส่ href = เป็นลิงก์ (ตัวกรองผ่าน URL) ใส่ onClick = เป็นปุ่ม (ตัวกรองฝั่ง client)
 */
export function Chip({
  active = false,
  href,
  onClick,
  icon: Icon,
  children,
  className,
}: {
  active?: boolean;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  const content = (
    <>
      {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn(chipClass(active), "lg:min-h-10", className)}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(chipClass(active), "lg:min-h-10", className)}
    >
      {content}
    </button>
  );
}
