"use client";

import type { LucideIcon } from "lucide-react";
import type { TileTint } from "@/components/visuals";
import { cn } from "@/lib/utils";

/**
 * แถวเปิด/ปิดที่แตะได้ทั้งแถว มีสวิตช์ทรงแคปซูลและบอกสถานะให้โปรแกรมอ่านหน้าจอ (v6: หน้าตาเดียวกับ ListRow)
 * ต้องวางใน <ListGroup> เพราะเป็น <li>
 */
export function ToggleRow({
  title,
  description,
  checked,
  disabled = false,
  onToggle,
}: {
  /** @deprecated v6: ไม่แสดงไอคอนในวงกลมแล้ว */
  icon?: LucideIcon;
  /** @deprecated v6 */
  tint?: TileTint;
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className="flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted active:bg-muted disabled:opacity-60"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-snug font-medium">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200",
            checked ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 size-6 rounded-full bg-background transition-transform duration-200 ease-out",
              checked && "translate-x-6",
            )}
          />
        </span>
      </button>
    </li>
  );
}
