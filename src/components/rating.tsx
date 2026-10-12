import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SampleBadge } from "./sample-badge";

/**
 * ดาวคะแนนรีวิว ใช้กับคะแนนจริงจากระบบ (ProviderSummary.rating / reviewCount)
 * ถ้าคะแนนมาจากข้อมูลตัวอย่าง ต้องใส่ sample เพื่อให้ขึ้นป้าย "ตัวอย่าง" ข้างดาวเสมอ
 * value เป็น null = ยังไม่มีรีวิว จะแสดงข้อความแทนดาว
 */
export function Rating({
  value,
  count,
  size = "md",
  sample = false,
  className,
}: {
  value: number | null;
  count?: number;
  size?: "sm" | "md";
  sample?: boolean;
  className?: string;
}) {
  if (value === null) {
    return <span className={cn("text-sm text-muted-foreground", className)}>ยังไม่มีรีวิว</span>;
  }
  const rounded = Math.round(value * 10) / 10;
  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-x-1.5 gap-y-1", className)}
      role="img"
      aria-label={`คะแนน ${rounded} จาก 5${count !== undefined ? ` จาก ${count} รีวิว` : ""}`}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              size === "sm" ? "size-4" : "size-5",
              n <= Math.round(value) ? "fill-marigold text-marigold" : "text-input",
            )}
          />
        ))}
      </span>
      <span className={cn("numeric font-medium", size === "sm" ? "text-sm" : "text-base")} aria-hidden="true">
        {rounded.toFixed(1)}
      </span>
      {count !== undefined ? (
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          ({count} รีวิว)
        </span>
      ) : null}
      {sample ? <SampleBadge /> : null}
    </span>
  );
}
