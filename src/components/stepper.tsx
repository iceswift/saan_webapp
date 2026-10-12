import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = string | { label: string; description?: string };

function parts(step: Step) {
  return typeof step === "string" ? { label: step, description: undefined } : step;
}

/**
 * ตัวบอกขั้นตอน
 * - steps: ชื่อขั้นตอนตามลำดับ (ข้อความสั้น หรือ {label, description})
 * - current: ลำดับขั้นปัจจุบันเริ่มที่ 0 ขั้นก่อนหน้าแสดงเครื่องหมายถูก ใส่ steps.length เมื่อเสร็จทั้งหมด
 * - orientation "horizontal" (ค่าเริ่มต้น): แถวเดียว ใช้บนหัวหน้าจอ | "vertical": รายการมีคำอธิบายแต่ละขั้น
 */
export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  info = false,
  className,
}: {
  steps: Step[];
  current: number;
  orientation?: "horizontal" | "vertical";
  /** true = ใช้อธิบายขั้นตอนเฉย ๆ ไม่ใช่ความคืบหน้า: ทุกขั้นเป็นเลขสีทองและตัวอักษรปกติ */
  info?: boolean;
  className?: string;
}) {
  const vertical = orientation === "vertical";
  return (
    <ol className={cn(vertical ? "flex flex-col" : "flex items-start", className)}>
      {steps.map((raw, i) => {
        const { label, description } = parts(raw);
        const done = !info && i < current;
        const now = !info && i === current;
        const last = i === steps.length - 1;
        return (
          <li
            key={label}
            aria-current={now ? "step" : undefined}
            className={cn("relative", vertical ? "flex gap-4" : "flex flex-1 flex-col items-center")}
          >
            <div className={cn(vertical && "flex flex-col items-center")}>
              <span
                className={cn(
                  "numeric flex size-9 shrink-0 items-center justify-center rounded-full border text-base font-medium transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  now && "border-2 border-gold bg-background text-gold-ink",
                  !done && !now && !info && "border-border bg-background text-muted-foreground",
                  info && "border-border bg-muted text-foreground",
                )}
              >
                {done ? <Check className="size-4.5" strokeWidth={2.6} aria-hidden="true" /> : i + 1}
              </span>
              {last ? null : (
                <span
                  aria-hidden="true"
                  className={cn(
                    "rounded-full",
                    vertical
                      ? "my-1 block min-h-6 w-0.5 flex-1"
                      : "absolute top-[1.0625rem] left-[calc(50%+1.6rem)] h-0.5 w-[calc(100%-3.2rem)]",
                    done ? "bg-primary" : "bg-border",
                    // เส้นที่ผ่านแล้วค่อย ๆ ลากต่อกัน ทีละขั้น
                    done && (vertical ? "origin-top animate-grow-y" : "origin-left animate-grow-x"),
                  )}
                  style={done ? ({ animationDelay: `${i * 120}ms` } as React.CSSProperties) : undefined}
                />
              )}
            </div>
            <div className={cn(vertical ? "pb-5" : "mt-2 w-full px-0.5 text-center", vertical && last && "pb-0")}>
              <p className={cn(vertical ? "text-base leading-snug" : "text-sm leading-snug", now || info ? "font-medium" : "font-medium", !done && !now && !info && "text-muted-foreground")}>
                {label}
              </p>
              {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
