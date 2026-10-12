import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * รายการแบบกลุ่ม (v6): กล่องเดียวมีเส้นขอบ 1px แถวคั่นด้วยเส้นบาง ไม่ใช่กล่องแยกใบต่อแถว
 * ใช้กับ ตั้งค่า บัญชี การแจ้งเตือน คำถามที่พบบ่อย งาน สมุดบน ที่อยู่
 * ลูกต้องเป็น <ListRow> (เป็น <li> อยู่แล้ว) ช่องกรอกข้อมูลไม่ต้องอยู่ในกลุ่มนี้ ให้วางบนหน้าตรง ๆ
 * - bare: ไม่มีกล่องและขอบข้าง เหลือเฉพาะเส้นคั่นบน-ล่างของแถว (ใช้เมื่อรายการอยู่ในส่วนที่มีหัวข้อแล้ว)
 * - label: ชื่อกลุ่มสำหรับโปรแกรมอ่านหน้าจอ
 */
export function ListGroup({
  children,
  bare = false,
  label,
  className,
}: {
  children: React.ReactNode;
  bare?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "flex flex-col divide-y divide-border overflow-hidden",
        bare ? "border-y border-border" : "surface",
        className,
      )}
    >
      {children}
    </ul>
  );
}

/**
 * แถวใน <ListGroup>: ภาพนำหน้า (thumb) · ชื่อ · ข้อมูลรอง · ส่วนท้าย
 * - href: ทั้งแถวเป็นลิงก์ (โฮเวอร์เป็นพื้นเบจ) ไม่ใส่ href = แถวข้อมูลเฉย ๆ หรือใส่ onClick = ปุ่ม
 * - thumb: ปกติ <ThumbArt/> หรือ <Monogram/> ถ้าไอคอนช่วยให้จำได้เร็วจริง ๆ ค่อยใช้ <IconTile size="sm"/>
 * - title: ข้อความหลัก (text-base font-medium) | meta: บรรทัดรองเดียว (text-sm muted)
 * - trailing: ค่า ป้ายสถานะ สวิตช์ หรือปุ่ม ถ้าเป็นลิงก์และไม่ใส่จะมีลูกศร > ให้เอง; ส่ง trailing={null} เพื่อไม่ให้มีลูกศร
 * - tone: "danger" = ชื่อสีแดง (เช่น ออกจากระบบ ลบบัญชี)
 */
export function ListRow({
  title,
  meta,
  thumb,
  trailing,
  href,
  onClick,
  tone,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  thumb?: React.ReactNode;
  trailing?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "danger";
  className?: string;
}) {
  const interactive = Boolean(href || onClick);
  const end =
    trailing !== undefined ? (
      trailing
    ) : interactive ? (
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-soft group-hover/row:translate-x-0.5"
      />
    ) : null;

  const body = (
    <>
      {thumb}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-base leading-snug font-medium",
            tone === "danger" && "text-destructive",
          )}
        >
          {title}
        </span>
        {meta ? <span className="mt-0.5 block text-sm text-muted-foreground">{meta}</span> : null}
      </span>
      {end}
    </>
  );
  const rowClass = cn(
    "group/row flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left",
    interactive && "transition-colors hover:bg-muted active:bg-muted",
    className,
  );

  return (
    <li className="min-w-0">
      {href ? (
        <Link href={href} className={rowClass}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowClass}>
          {body}
        </button>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  );
}
