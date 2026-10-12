import { cn } from "@/lib/utils";

/**
 * ป้าย "ตัวอย่าง" บอกว่าเนื้อหาส่วนนี้เป็นข้อมูลตัวอย่างของหน้าจอ ยังไม่ใช่ข้อมูลจริง
 * ต้องวางที่หัวข้อหรือมุมของทุกส่วนที่ใช้ข้อมูลใน src/lib/mock และลูกค้าอาจเข้าใจผิดว่าเป็นความจริง
 * (รีวิว คะแนน จำนวน ราคา วันที่ โปรโมชัน) เส้นประ = ยังไม่ใช่ของจริง
 */
export function SampleBadge({
  label = "ตัวอย่าง",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      title="ข้อมูลตัวอย่าง ไม่ใช่ข้อมูลจริง"
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border border-dashed border-gold-ink/60 bg-background px-2.5 text-sm leading-none font-medium whitespace-nowrap text-gold-ink",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-ink" />
      {label}
      <span className="sr-only"> ข้อมูลตัวอย่าง ไม่ใช่ข้อมูลจริง</span>
    </span>
  );
}
