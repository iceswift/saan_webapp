import { cn } from "@/lib/utils";

const DOT = {
  neutral: "bg-muted-foreground",
  wait: "bg-gold",
  info: "bg-foreground",
  good: "bg-foreground",
  bad: "bg-destructive",
} as const;

/**
 * บล็อกสถานะเดียวของหนึ่งงาน (v6): ประโยคบอกว่าตอนนี้เกิดอะไร + เส้นความคืบหน้าบาง
 * แทนที่ป้ายสถานะ + ตัวบอกขั้นตอน + สถานะในแผงข้าง + กล่องแจ้งซ้ำกันในหน้ารายละเอียด (ใส่ที่เดียวต่อหน้า)
 * ในรายการ (list row) ใช้เพียงป้าย <OrderStatusBadge> ไม่ใช้ StatusLine
 *
 * ตัวอย่าง: <StatusLine title="ร้านกำลังเตรียมงาน" detail="นัด อา. 18 ต.ค. 06:41" step={3} steps={["สั่ง","ร้านยืนยัน","ชำระมัดจำ","ทำงาน","ตรวจรับ"]} />
 * - title: ประโยคสถานะ (ข้อความเต็มสั้น ๆ) | detail: เวลา/ผู้เกี่ยวข้อง (muted)
 * - steps: ชื่อขั้นตอนตามลำดับ (ใช้นับความยาวเส้นและอ่านออกเสียง ไม่แสดงเป็นป้าย)
 * - step: ลำดับขั้นปัจจุบัน (เริ่ม 0) ใส่ steps.length เมื่อเสร็จทั้งหมด
 * - tone: สีจุดนำหน้า "wait" (รอใครสักคนทำ) | "good" | "bad" (ยกเลิก/ปฏิเสธ) | "neutral" | "info"
 * - children: ปุ่มหรือข้อความบอกสิ่งที่ต้องทำต่อ (หนึ่งปุ่มหลักได้)
 */
export function StatusLine({
  title,
  detail,
  steps,
  step,
  tone = "info",
  children,
  className,
}: {
  title: string;
  detail?: string;
  steps?: string[];
  step?: number;
  tone?: keyof typeof DOT;
  children?: React.ReactNode;
  className?: string;
}) {
  const total = steps?.length ?? 0;
  const current = Math.max(0, Math.min(step ?? 0, total));
  return (
    <div className={cn("surface p-4 lg:p-5", className)} role="status">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={cn("mt-2.5 size-2.5 shrink-0 rounded-full", DOT[tone])} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-snug font-normal text-balance lg:text-xl">{title}</p>
          {detail ? <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p> : null}
        </div>
      </div>
      {total > 0 ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-valuetext={
            current >= total ? "เสร็จสิ้น" : `ขั้นที่ ${current + 1} จาก ${total}: ${steps?.[current] ?? ""}`
          }
          className="mt-4 flex gap-1"
        >
          {steps?.map((label, i) => {
            const done = i < current;
            const now = i === current && tone !== "bad";
            return (
              // v6.2: รางบาง ๆ + แถบเติมที่ขยายจากซ้ายไปขวา (scaleX) เมื่อสถานะเปลี่ยนจึงเห็นความคืบหน้าเดินไปข้างหน้า
              // ใช้ transform ไม่ใช้ความกว้าง จึงไม่มีเลย์เอาต์ขยับ และสถานะสุดท้ายถูกต้องเสมอแม้ไม่มีแอนิเมชัน
              <span key={label} className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
                <span
                  className={cn(
                    "absolute inset-0 origin-left rounded-full transition-[transform,background-color] duration-500 ease-soft",
                    done || now ? "scale-x-100" : "scale-x-0",
                    done ? "bg-primary" : "bg-gold",
                    now && "delay-150",
                  )}
                />
              </span>
            );
          })}
        </div>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
