"use client";

import { cn } from "@/lib/utils";

/**
 * สวิตช์เปิด/ปิดแบบแคปซูล (role=switch) ใช้กับสถานะเปิดขายของสินค้าและบริการ
 * ปุ่มกดได้ 44px แม้ตัวสวิตช์เล็ก
 */
export function StatusSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** ชื่อสำหรับโปรแกรมอ่านหน้าจอ เช่น "เปิดขาย ศาลพระภูมิไม้สัก" */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("flex min-h-11 min-w-11 shrink-0 items-center justify-center disabled:opacity-60", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-background transition-transform duration-200 ease-out",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
