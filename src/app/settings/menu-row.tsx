import type { LucideIcon } from "lucide-react";
import { ListRow } from "@/components/list-group";
import type { TileTint } from "@/components/visuals";

/**
 * แถวเมนูที่กดแล้วไปหน้าอื่น ใช้ร่วมกันทั้งหน้าบัญชีและหน้าตั้งค่า (v6: สร้างบน ListRow)
 * ต้องวางใน <ListGroup> เพราะเป็น <li> ไม่มีไอคอนในวงกลมแล้ว (icon และ tint ยังรับได้เพื่อความเข้ากันได้ แต่ไม่แสดง)
 * badge: ป้ายเล็กต่อท้ายชื่อ เช่น <SoonBadge /> หรือ <SampleBadge />
 * value: ค่าปัจจุบันชิดขวาก่อนลูกศร (ถ้ามี) | thumb: ภาพนำหน้า (ThumbArt / Monogram) เมื่อแถวนั้น "คือ" สิ่งของจริง
 */
export function MenuRow({
  href,
  title,
  description,
  badge,
  thumb,
  tone,
}: {
  href: string;
  /** @deprecated v6: ไม่แสดงไอคอนในวงกลมแล้ว */
  icon?: LucideIcon;
  /** @deprecated v6 */
  tint?: TileTint;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  thumb?: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <ListRow
      href={href}
      thumb={thumb}
      tone={tone}
      title={
        badge ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {title}
            {badge}
          </span>
        ) : (
          title
        )
      }
      meta={description}
    />
  );
}
