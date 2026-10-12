import { Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  amber: "bg-tint-amber text-tint-amber-ink",
  mint: "bg-tint-mint text-tint-mint-ink",
  rose: "bg-tint-rose text-tint-rose-ink",
  sky: "bg-tint-sky text-tint-sky-ink",
  violet: "bg-tint-violet text-tint-violet-ink",
  gold: "bg-gold-soft text-gold-ink",
} as const;

/**
 * กล่องแจ้งข้อมูลสั้น ๆ ในหน้า เช่น "โหมดทดสอบ ยังไม่มีการตัดเงินจริง" หรือคำเตือนก่อนยืนยัน
 * amber = โหมดทดสอบ/ควรระวัง | rose = ข้อผิดพลาด | mint = สำเร็จ | sky = ข้อมูลทั่วไป | gold = ข้อมูลสำคัญ
 */
export function Notice({
  tone = "amber",
  icon: Icon = Info,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        "rise flex items-start gap-3 rounded-lg px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
