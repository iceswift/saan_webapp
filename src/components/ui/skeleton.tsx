import { cn } from "cn"

/** พื้นโครงรอโหลด: กะพริบความทึบเบา ๆ ไม่มีแสงวิ่ง (หยุดเมื่อผู้ใช้ปิดการเคลื่อนไหว) */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse-soft rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
