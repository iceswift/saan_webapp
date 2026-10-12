import { cn } from "@/lib/utils";

/**
 * เส้นความคืบหน้าบางสำหรับฟอร์มหลายขั้น (v6) มีป้าย "1/4" ที่มุม แทนตัวบอกขั้นตอนแบบวงกลมในวิซาร์ด
 * หน้าชำระเงินไม่ต้องมีตัวบอกขั้นที่สองซ้ำ
 * - value: ขั้นปัจจุบัน (เริ่ม 1) | max: จำนวนขั้นทั้งหมด | label: ชื่อขั้นปัจจุบัน (ถ้ามี แสดงข้างเลข)
 * ความกว้างเส้นเลื่อนนุ่ม ๆ เมื่อเปลี่ยนขั้น
 */
export function ProgressBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
        <span className="min-w-0 truncate">{label}</span>
        <span className="numeric shrink-0 font-medium text-foreground">
          {value}/{max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`ขั้นที่ ${value} จาก ${max}${label ? `: ${label}` : ""}`}
        className="h-1 overflow-hidden rounded-full bg-border"
      >
        <div className="progress-fill h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
