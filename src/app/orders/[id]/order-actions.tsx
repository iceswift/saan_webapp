"use client";

import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Star } from "lucide-react";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ImageUpload } from "@/components/image-upload";
import { PriceTicker } from "@/components/price-ticker";
import { useOrderLive } from "@/components/order-live";
import { TrustNote } from "@/components/trust-note";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineConfirm } from "@/app/request/inline-confirm";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PendingPayment } from "@/lib/payment-result";
import { cancelOrder, confirmCompletion, payDeposit, submitReview } from "@/server/actions/orders";

const METHODS: PaymentMethod[] = ["PROMPTPAY", "CARD"];
const STARS = [1, 2, 3, 4, 5] as const;
const RATING_WORDS = ["", "ยังไม่ประทับใจ", "พอใช้", "ดี", "ดีมาก", "ดีเยี่ยม"] as const;

function PaymentMethodPicker({
  value,
  onChange,
  promptPayOnly = false,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  promptPayOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="วิธีชำระเงิน">
      {(promptPayOnly ? METHODS.filter((method) => method === "PROMPTPAY") : METHODS).map((method) => {
        const on = value === method;
        return (
          <button
            key={method}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(method)}
            className="surface flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted"
          >
            <span className="flex-1 text-base font-medium">{PAYMENT_METHODS[method]}</span>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-input",
                on && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {on ? <Check className="size-4" strokeWidth={3} /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AmountBlock({ label, amount }: { label: string; amount: number }) {
  return (
    <div>
      <h2 className="text-base font-medium">{label}</h2>
      <PriceTicker amount={amount} size="xl" emphasis />
    </div>
  );
}

function PendingQr({ payment }: { payment: PendingPayment }) {
  return <section className="flex flex-col gap-3" aria-label="คิวอาร์โค้ดชำระเงินทดสอบ">
    <p role="status" className="text-base">รอชำระเงินทดสอบ</p>
    {/* Provider-validated HTTPS document; do not optimize or forward API credentials. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={payment.qrUrl} alt="คิวอาร์โค้ด PromptPay สำหรับรายการทดสอบ" width={256} height={256} className="mx-auto size-64 rounded-lg" />
    <p className="text-sm text-muted-foreground">โหมดทดสอบ ไม่ต้องสแกนหรือโอนเงินจริง ให้เปลี่ยนสถานะใน Omise Test Dashboard แล้วกดตรวจสอบ</p>
    <p className="text-sm text-muted-foreground">หมดอายุ {new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(payment.expiresAt))}</p>
  </section>;
}

/** ลูกค้าจ่ายมัดจำเพื่อให้ร้านยืนยันคำสั่ง */
export function PayDepositPanel({
  orderId,
  amount,
  isMock,
  omiseTest = false,
}: {
  orderId: string;
  amount: number;
  isMock: boolean;
  omiseTest?: boolean;
}) {
  const [qr, setQr] = useState<PendingPayment>();
  const [method, setMethod] = useState<PaymentMethod>("PROMPTPAY");
  const [pending, startTransition] = useTransition();
  const { celebrate } = useOrderLive();

  function pay() {
    startTransition(async () => {
      const res = await payDeposit({ orderId, method });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.data?.status === "PENDING") { setQr(res.data); return; }
      setQr(undefined);
      celebrate({
        key: "deposit",
        title: "ชำระมัดจำแล้ว",
        text: "ร้านจะยืนยันรับงานเร็วๆ นี้",
        amount,
        mock: isMock,
      });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <AmountBlock label="ยอดมัดจำที่ต้องจ่าย" amount={amount} />
      {qr ? <PendingQr payment={qr} /> : <PaymentMethodPicker value={method} onChange={setMethod} promptPayOnly={omiseTest} />}
      <Button type="button" variant="gold" size="xl" className="w-full" loading={pending} onClick={pay}>
        {qr ? "ตรวจสอบการชำระเงิน" : `จ่ายมัดจำ ${formatBaht(amount)}`}
      </Button>
      <TrustNote items={["deposit", "cancel"]} testMode={isMock} />
    </div>
  );
}

/** ร้านแจ้งว่างานเสร็จแล้ว ลูกค้าตรวจรับและจ่ายส่วนที่เหลือ */
export function CompleteOrderPanel({
  orderId,
  balance,
  isMock,
  omiseTest = false,
}: {
  orderId: string;
  balance: number;
  isMock: boolean;
  omiseTest?: boolean;
}) {
  const [qr, setQr] = useState<PendingPayment>();
  const [method, setMethod] = useState<PaymentMethod>("PROMPTPAY");
  const [pending, startTransition] = useTransition();
  const { celebrate } = useOrderLive();

  function complete() {
    startTransition(async () => {
      const res = await confirmCompletion({ orderId, method });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.data?.status === "PENDING") { setQr(res.data); return; }
      setQr(undefined);
      celebrate({
        key: "complete",
        title: "ตรวจรับงานแล้ว",
        text: "งานนี้เสร็จสมบูรณ์ ขอบคุณที่ใช้ Saan",
        ...(balance > 0 ? { amount: balance, mock: isMock } : {}),
      });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl font-medium">ตรวจรับงาน</h2>
      <p className="text-base text-muted-foreground">ตรวจสอบผลงานให้เรียบร้อยก่อนยืนยัน</p>
      {balance > 0 ? (
        <>
          <AmountBlock label="ยอดที่เหลือ" amount={balance} />
          {qr ? <PendingQr payment={qr} /> : <PaymentMethodPicker value={method} onChange={setMethod} promptPayOnly={omiseTest} />}
        </>
      ) : null}
      <Button type="button" variant="gold" size="xl" className="w-full" loading={pending} onClick={complete}>
        {qr ? "ตรวจสอบการชำระเงิน" : balance > 0 ? `ตรวจรับงานและจ่าย ${formatBaht(balance)}` : "ตรวจรับงาน"}
      </Button>
      <TrustNote items={["deposit"]} testMode={isMock && balance > 0} />
    </div>
  );
}

/** ยกเลิกได้จนกว่าร้านจะยืนยัน ต้องแตะยืนยันซ้ำหนึ่งครั้ง */
export function CancelOrderControl({
  orderId,
  hasDeposit,
}: {
  orderId: string;
  hasDeposit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function cancel() {
    startTransition(async () => {
      const res = await cancelOrder({ orderId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ยกเลิกคำสั่งแล้ว");
    });
  }

  return (
    <InlineConfirm
      triggerLabel="ยกเลิกคำสั่ง"
      question={hasDeposit ? "ยืนยันการยกเลิก ทีมงานจะติดต่อเพื่อคืนมัดจำ" : "ยืนยันการยกเลิกคำสั่งนี้"}
      confirmLabel="ยืนยันยกเลิก"
      pending={pending}
      onConfirm={cancel}
    />
  );
}

/** รีวิวได้ครั้งเดียวหลังงานเสร็จสมบูรณ์ */
export function ReviewForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { celebrate } = useOrderLive();
  // หน้าลูกค้าบนเดสก์ท็อปแสดงแบบฟอร์มนี้ได้สองชุด (มือถือกับแผงข้าง) จึงต้องมี id ไม่ซ้ำ
  const commentId = useId();
  const ratingHint = useId();

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("กรุณาแตะดาวเพื่อให้คะแนน");
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await submitReview({ orderId, rating, comment, ...(photos.length > 0 ? { photoUrls: photos } : {}) });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      celebrate({ title: "ขอบคุณสำหรับรีวิว", text: "ความเห็นของคุณช่วยให้ลูกค้าท่านอื่นเลือกร้านได้" });
    });
  }

  return (
    <form ref={formRef} onSubmit={send} className="flex flex-col gap-5">
      <div>
        <p className="font-display text-xl">ให้คะแนนงานนี้</p>
        <div className="mt-2 flex items-center gap-1" role="group" aria-label="ให้คะแนน">
          {STARS.map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ดาว`}
              aria-pressed={rating === n}
              aria-invalid={Boolean(error) && n === 1 ? true : undefined}
              aria-describedby={ratingHint}
              onClick={() => {
                setRating(n);
                setError(null);
              }}
              className="flex size-12 items-center justify-center rounded-full transition-transform hover:bg-muted active:scale-90"
            >
              <Star
                aria-hidden="true"
                className={cn("size-8", n <= rating ? "fill-marigold text-marigold" : "text-input")}
              />
            </button>
          ))}
        </div>
        <FieldHint id={ratingHint} error={error} className="mt-1">
          {rating > 0 ? RATING_WORDS[rating] : null}
        </FieldHint>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={commentId} className="text-base">
          ความเห็นเพิ่มเติม (ไม่บังคับ)
        </Label>
        <Textarea
          id={commentId}
          maxLength={1000}
          rows={2}
          className="lg:min-h-20"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-base font-medium">แนบรูปผลงานจริง (ไม่บังคับ)</p>
        <ImageUpload value={photos} onChange={setPhotos} max={4} label="เพิ่มรูป" />
        <p className="text-sm text-muted-foreground">
          แนบได้ไม่เกิน 4 รูป รูปจะแสดงให้ลูกค้าท่านอื่นเห็นในหน้าร้าน
        </p>
      </div>
      <Button type="submit" size="xl" className="w-full" loading={pending}>
        ส่งรีวิว
      </Button>
    </form>
  );
}
