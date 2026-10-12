import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { IconTile, type TileTint } from "./visuals";

/**
 * ช่องตัวเลขสรุป เช่น จำนวนงานที่รอ ใช้เรียงเป็นกริด 2-3 คอลัมน์ในหน้าร้านและผู้ดูแล
 * ตัวเลขต้องมาจากข้อมูลจริง ถ้าเป็นตัวอย่างให้ใส่ป้าย SampleBadge ที่หัวส่วน
 */
export function StatTile({
  icon,
  tint = "mint",
  label,
  value,
  hint,
  href,
  className,
}: {
  icon: LucideIcon;
  tint?: TileTint;
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** ใส่เมื่อต้องการให้ทั้งช่องกดไปหน้ารายละเอียดได้ */
  href?: string;
  className?: string;
}) {
  const classes = cn("surface flex flex-col gap-3 p-4", href && "transition-colors hover:bg-muted", className);
  const body = (
    <>
      <IconTile icon={icon} tint={tint} size="sm" />
      <div>
        <p className="numeric font-display text-2xl leading-tight font-normal">{typeof value === "number" ? <CountUp value={value} /> : value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-sm text-gold-ink">{hint}</p> : null}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
