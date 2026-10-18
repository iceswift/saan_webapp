import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * การ์ดตัวเลือกแบบเลือกหนึ่งอย่าง (ข้อความ + จุดเลือกด้านขวา) ไม่มีไอคอนวงกลม
 * ใส่ leading (ภาพวาดศาลหรือบริการ) เฉพาะเมื่อภาพช่วยให้จำได้จริง
 * เลือกอยู่ = กรอบสีชาดหนา (stylesheet จัดการจาก aria-pressed + border-primary) และจุดขวาเด้งเบา ๆ
 * โครงสร้าง span[aria-hidden] ตัวสุดท้ายต้องเป็นจุดเลือก เพื่อให้แอนิเมชันของ stylesheet ทำงาน
 */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  leading,
  multi = false,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  leading?: React.ReactNode;
  /** true = เลือกได้หลายอย่าง (จุดเป็นสี่เหลี่ยมมน) */
  multi?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "surface flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        selected ? "border-primary" : "hover:bg-muted",
        className,
      )}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-relaxed font-medium">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border-2",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {selected ? <Check className="size-4" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
