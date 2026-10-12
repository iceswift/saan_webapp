import { cn } from "@/lib/utils";
import { ArchMark } from "./brand";

const PROMISES = {
  deposit: {
    title: "มัดจำถูกพักไว้จนคุณตรวจรับ",
    text: "ร้านจะได้รับเงินเมื่อคุณกดตรวจรับงานแล้ว",
  },
  verified: {
    title: "ร้านผ่านการตรวจสอบ",
    text: "ทีมงานตรวจสอบร้านก่อนเปิดให้ขายศาลและบริการ",
  },
  cancel: {
    title: "ยกเลิกได้จนกว่าร้านจะยืนยัน",
    text: "หลังร้านยืนยันงานแล้ว กรุณาติดต่อทีมงาน",
  },
} as const;
export type TrustKey = keyof typeof PROMISES;

/**
 * กรอบ "คำมั่นของระบบ" (v6): กรอบเส้นบาง มีซุ้มประตูศาลนำ แล้วตามด้วยข้อความจริงของแอป 1-3 ข้อ
 * ข้อความเป็นกติกาของแอปเท่านั้น ไม่ใช่การรับประกันทางการเงินหรือกฎหมาย (ห้ามเรียกว่า escrow)
 * วางข้างราคาในหน้าสินค้า หน้าชำระเงิน และแถวความมั่นใจหน้าแรก
 *
 * - items: ข้อที่จะแสดง (ค่าเริ่มต้นครบสามข้อ) เลือกเฉพาะที่เกี่ยวกับจุดนั้น
 * - layout: "stack" (ค่าเริ่มต้น เรียงลง ใช้ในแผงข้าง) | "row" (สามคอลัมน์บนเดสก์ท็อป ใช้หน้าแรก)
 * - testMode: ส่ง IS_MOCK_PAYMENT จากหน้า server เมื่ออยู่ใกล้ปุ่มจ่ายเงิน จะมีบรรทัด
 *   "โหมดทดสอบ ยังไม่มีการตัดเงินจริง" ต่อท้ายเสมอ (ห้ามละเมื่อระบบยังจำลองการชำระเงิน)
 */
export function TrustNote({
  items = ["deposit", "verified", "cancel"],
  layout = "stack",
  testMode = false,
  className,
}: {
  items?: TrustKey[];
  layout?: "stack" | "row";
  testMode?: boolean;
  className?: string;
}) {
  const row = layout === "row";
  return (
    <section
      aria-label="คำมั่นของ Saan"
      className={cn("rounded-2xl border border-gold-line p-4 lg:p-5", className)}
    >
      <div className={cn(row && "lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-6")}>
        <ArchMark className="mb-2 size-7 text-foreground lg:mb-0 lg:size-9" />
        <ul
          className={cn(
            "flex flex-col gap-3",
            row && "lg:grid lg:grid-cols-3 lg:gap-8",
          )}
        >
          {items.map((key) => (
            <li key={key}>
              <p className="text-base leading-snug font-medium">{PROMISES[key].title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{PROMISES[key].text}</p>
            </li>
          ))}
        </ul>
      </div>
      {testMode ? (
        <p className="mt-3 border-t border-border pt-3 text-sm text-tint-amber-ink">
          <span className="rounded-full bg-tint-amber px-2.5 py-0.5">โหมดทดสอบ ยังไม่มีการตัดเงินจริง</span>
        </p>
      ) : null}
    </section>
  );
}
