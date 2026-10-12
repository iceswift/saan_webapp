"use client";

import { Check } from "lucide-react";
import { chipClass } from "@/components/chip";
import { cn } from "@/lib/utils";

export type OptionItem<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  /** ภาพนำหน้า (v6: ThumbArt เมื่อตัวเลือกคือศาลหรือบริการ ไม่ใช้ไอคอนในวงกลม) */
  thumb?: React.ReactNode;
};

/** ประกอบตัวเลือกจากชื่อไทยของแต่ละรหัส */
export function buildOptions<T extends string>(
  labels: Record<T, string>,
  extra?: { hints?: Partial<Record<T, string>>; thumb?: (value: T) => React.ReactNode },
): OptionItem<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
    hint: extra?.hints?.[value],
    thumb: extra?.thumb?.(value),
  }));
}

/**
 * เลือกหนึ่งข้อจากการ์ดใหญ่แตะง่าย (aria-pressed)
 * invalid = ยังไม่ได้เลือก (หลังกดปุ่ม): ใส่ aria-invalid ที่ตัวเลือกแรกให้ focusFirstInvalid โฟกัสได้
 */
export function OptionCards<T extends string>({
  options,
  value,
  onChange,
  invalid = false,
  describedBy,
  className,
}: {
  options: OptionItem<T>[];
  value: T | null;
  onChange: (value: T) => void;
  invalid?: boolean;
  describedBy?: string;
  /** ปรับจำนวนคอลัมน์ เช่น "xl:grid-cols-1" */
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-invalid={invalid && i === 0 ? true : undefined}
            aria-describedby={i === 0 ? describedBy : undefined}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-16 items-center gap-4 surface p-3 text-left",
              selected ? "border-primary" : "hover:bg-muted",
              invalid && !value && "border-destructive/60",
            )}
          >
            {option.thumb}
            <span className="min-w-0 flex-1 px-1">
              <span className="block text-base font-medium">{option.label}</span>
              {option.hint ? (
                <span className="block text-sm text-muted-foreground">{option.hint}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** เลือกได้หลายข้อจากชิปปุ่ม ใช้กับพื้นที่ให้บริการ */
export function ToggleChips<T extends string>({
  options,
  value,
  onChange,
  invalid = false,
  describedBy,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  function toggle(item: T) {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, i) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-invalid={invalid && i === 0 ? true : undefined}
            aria-describedby={i === 0 ? describedBy : undefined}
            onClick={() => toggle(option.value)}
            className={chipClass(selected)}
          >
            {selected ? <Check className="size-4" strokeWidth={2.5} aria-hidden="true" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
