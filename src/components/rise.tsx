import { cn } from "@/lib/utils";

/**
 * ห่อบล็อกให้ลอยขึ้นเบา ๆ ตอนหน้าโหลด (ใช้กับส่วนบนของหน้าไม่เกิน 4-5 บล็อก)
 * i = ลำดับการเข้าฉาก (0, 1, 2 …) แต่ละลำดับหน่วง 70ms ผู้ใช้ที่ปิดการเคลื่อนไหวจะไม่เห็นผลนี้
 */
export function Rise({
  i = 0,
  className,
  children,
}: {
  i?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rise", className)} style={{ "--i": i } as React.CSSProperties}>
      {children}
    </div>
  );
}
