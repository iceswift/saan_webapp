"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PriceTicker } from "@/components/price-ticker";
import { StatusLine } from "@/components/status-line";
import { SuccessMark } from "@/components/success-mark";
import { Button } from "@/components/ui/button";

type StatusProps = {
  title: string;
  detail?: string;
  steps?: string[];
  step?: number;
  tone?: "wait" | "info" | "good" | "bad" | "neutral";
};

/** ช่วงเวลาสำเร็จ (จ่ายมัดจำ ตรวจรับ รีวิว) */
export type OrderMoment = {
  /** ชื่อสถานะที่หน้าจะเปลี่ยนไป (ใช้กับ optimistic) ใส่คีย์ที่ตรงกับ after ของ LiveStatusLine */
  key?: string;
  title: string;
  text: string;
  /** ยอดเงินที่จ่าย (ไม่มี = ไม่แสดง) */
  amount?: number;
  /** แสดงข้อความ "โหมดทดสอบ" เมื่อมียอดเงิน */
  mock?: boolean;
};

type Ctx = { celebrate: (moment: OrderMoment) => void; optimisticKey: string | null };
const OrderLiveContext = createContext<Ctx>({ celebrate: () => {}, optimisticKey: null });

export function useOrderLive() {
  return useContext(OrderLiveContext);
}

/**
 * ครอบหน้ารายละเอียดคำสั่ง (v6.2)
 * - celebrate(): เปิดช่วงเวลาสำเร็จเต็มจอ และ (ถ้ามี key) เปลี่ยนข้อความสถานะทันทีก่อนข้อมูลจากเซิร์ฟเวอร์มาถึง
 * - sig: ลายเซ็นสถานะจริงจากเซิร์ฟเวอร์ (เช่น order.status) เมื่อค่านี้เปลี่ยน ข้อความที่เดาไว้จะถูกแทนด้วยค่าจริงเอง
 */
export function OrderLive({ sig, children }: { sig: string; children: React.ReactNode }) {
  const [moment, setMoment] = useState<OrderMoment | null>(null);
  const [guess, setGuess] = useState<{ key: string; sig: string } | null>(null);
  const sigRef = useRef(sig);
  useEffect(() => {
    sigRef.current = sig;
  }, [sig]);

  const celebrate = useCallback((next: OrderMoment) => {
    if (next.key) setGuess({ key: next.key, sig: sigRef.current });
    setMoment(next);
  }, []);

  const optimisticKey = guess && guess.sig === sig ? guess.key : null;
  const value = useMemo(() => ({ celebrate, optimisticKey }), [celebrate, optimisticKey]);

  return (
    <OrderLiveContext.Provider value={value}>
      {children}
      {moment ? <PaymentMoment moment={moment} onClose={() => setMoment(null)} /> : null}
    </OrderLiveContext.Provider>
  );
}

/** StatusLine ที่เปลี่ยนข้อความทันทีหลังทำรายการสำเร็จ แล้วกลับไปใช้ค่าจริงเมื่อเซิร์ฟเวอร์ส่งสถานะใหม่มา */
export function LiveStatusLine({
  actual,
  after,
  children,
  className,
}: {
  actual: StatusProps;
  after?: Record<string, StatusProps>;
  children?: React.ReactNode;
  className?: string;
}) {
  const { optimisticKey } = useOrderLive();
  const shown = (optimisticKey && after?.[optimisticKey]) || actual;
  return (
    <StatusLine
      title={shown.title}
      detail={shown.detail}
      steps={shown.steps}
      step={shown.step}
      tone={shown.tone}
      className={className}
    >
      {children}
    </StatusLine>
  );
}

/**
 * ช่วงเวลาชำระเงินสำเร็จ: เต็มจอ เรียบ ๆ เครื่องหมายซุ้มวาดเข้ามา ยอดเงินวิ่งเข้าหาค่าจริง ข้อความจริงหนึ่งบรรทัด
 * ไม่บล็อกผู้ใช้ที่ปิดการเคลื่อนไหว (ทุกอย่างอยู่ที่ตำแหน่งสุดท้ายทันที) ปิดได้ด้วยปุ่มหรือ Esc
 */
function PaymentMoment({ moment, onClose }: { moment: OrderMoment; onClose: () => void }) {
  const [shownAmount, setShownAmount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ยอดเงินเริ่มจาก 0 แล้ววิ่งไปยอดจริง (PriceTicker ไม่วิ่งในครั้งแรก จึงเปลี่ยนค่าหลังขึ้นจอเล็กน้อย)
  useEffect(() => {
    if (!moment.amount) return;
    const t = window.setTimeout(() => setShownAmount(moment.amount ?? 0), 450);
    return () => window.clearTimeout(t);
  }, [moment.amount]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="moment-title"
      aria-describedby="moment-text"
      className="track-moment fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-background px-6 py-10"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        // มีปุ่มเดียวในกล่อง: ไม่ให้โฟกัสหลุดไปหน้าด้านหลัง
        if (e.key === "Tab") {
          e.preventDefault();
          buttonRef.current?.focus();
        }
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div style={{ "--i": 0 } as React.CSSProperties}>
          <SuccessMark className="size-28" />
        </div>
        <h2
          id="moment-title"
          style={{ "--i": 1 } as React.CSSProperties}
          className="mt-6 font-display text-[1.75rem] leading-[1.3] font-normal text-balance"
        >
          {moment.title}
        </h2>
        {moment.amount ? (
          <div style={{ "--i": 2 } as React.CSSProperties} className="mt-3">
            <PriceTicker amount={shownAmount} size="xl" duration={900} />
          </div>
        ) : null}
        <p
          id="moment-text"
          style={{ "--i": 3 } as React.CSSProperties}
          className="mt-3 text-base leading-relaxed text-balance text-muted-foreground"
        >
          {moment.text}
        </p>
        {moment.amount && moment.mock ? (
          <p style={{ "--i": 4 } as React.CSSProperties} className="mt-2 text-sm text-muted-foreground">
            โหมดทดสอบ ยังไม่มีการตัดเงินจริง
          </p>
        ) : null}
        <div style={{ "--i": 5 } as React.CSSProperties} className="mt-8 w-full">
          <Button ref={buttonRef} type="button" size="xl" className="w-full" onClick={onClose}>
            ไปต่อ
          </Button>
        </div>
      </div>
    </div>
  );
}
