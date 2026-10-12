import { cn } from "@/lib/utils";

/**
 * เครื่องหมายสำเร็จ (v6): ซุ้มประตูศาลค่อย ๆ ขยายเข้ามาแล้วเส้นเช็กถูกถูกลากตามทีหลัง (CSS ล้วน หยุดเมื่อปิดการเคลื่อนไหว)
 * ใช้ตอนจ่ายมัดจำสำเร็จ ส่งรีวิวแล้ว หรือบันทึกสำเร็จ ใส่ขนาดด้วย className เช่น size-20
 */
export function SuccessMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("success-mark size-20", className)}
    >
      <path
        className="ring origin-bottom fill-gold-soft stroke-gold"
        d="M11 58V30a21 21 0 0 1 42 0V58Z"
        strokeWidth="2.5"
      />
      <path className="tick stroke-gold-ink" d="M21 38L29 46L43 28" strokeWidth="4" />
    </svg>
  );
}
