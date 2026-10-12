import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";

export const priceSizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

/** คลาสของตัวเลขราคา ใช้ร่วมกับ PriceTicker */
export function priceNumberClass(size: keyof typeof priceSizes, emphasis: boolean) {
  return cn(
    "numeric font-display font-normal",
    emphasis ? "text-gold-ink" : "text-foreground",
    priceSizes[size],
  );
}

/**
 * ราคา: ตัวเลขน้ำหนักปกติด้วยฟอนต์หัวเรื่อง ตัวเลขกว้างเท่ากัน มีคำนำและราคาเดิมขีดฆ่าได้
 * v6: ค่าเริ่มต้นเป็นสีดำ (เงินไม่ควรเป็นสีสัญญาณทุกที่) ใส่ emphasis เฉพาะ "ราคาที่ใช้ตัดสินใจ"
 * ของหน้า (ราคาในหน้าสินค้า และยอดชำระในหน้าชำระมัดจำ) หนึ่งหน้าไม่เกินหนึ่งจุด
 * `plain` ยังรับได้ (เป็นค่าเริ่มต้นอยู่แล้ว จึงไม่มีผล)
 */
export function Price({
  amount,
  size = "md",
  prefix,
  was,
  suffix,
  emphasis = false,
  smallSymbol = false,
  className,
}: {
  amount: number;
  size?: keyof typeof priceSizes;
  /** คำนำหน้า เช่น "เริ่มต้น" */
  prefix?: string;
  /** ราคาเดิมที่ถูกขีดฆ่า (ใช้เมื่อมีส่วนลดจริงเท่านั้น) */
  was?: number;
  /** คำต่อท้าย เช่น "ต่อครั้ง" */
  suffix?: string;
  /** true = ตัวเลขสีชาด ใช้กับราคาที่ใช้ตัดสินใจเพียงจุดเดียวต่อหน้า */
  emphasis?: boolean;
  /** true = เครื่องหมาย ฿ เล็กกว่าตัวเลขเล็กน้อย (ใช้บนการ์ดศาล) */
  smallSymbol?: boolean;
  /** @deprecated v6: สีดำเป็นค่าเริ่มต้นแล้ว prop นี้ไม่มีผล */
  plain?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      {prefix ? <span className="text-sm text-muted-foreground">{prefix}</span> : null}
      <span className={priceNumberClass(size, emphasis)}>
        {smallSymbol ? (
          <>
            <span className="mr-px text-[0.78em]">฿</span>
            {amount.toLocaleString("en-US")}
          </>
        ) : (
          formatBaht(amount)
        )}
      </span>
      {was ? (
        <span className="numeric text-sm text-muted-foreground line-through">{formatBaht(was)}</span>
      ) : null}
      {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}
