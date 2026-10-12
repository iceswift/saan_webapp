"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InlineConfirm } from "@/app/request/inline-confirm";
import { acceptQuote, closeRequest } from "@/server/actions/customer";

/** เลือกร้านนี้: ปุ่มชาดเฉพาะใบที่แนะนำ ใบอื่นเป็นปุ่มขอบ (หน้านี้มีปุ่มชาดได้ปุ่มเดียว) */
export function AcceptQuoteButton({
  quoteId,
  variant = "outline",
}: {
  quoteId: string;
  variant?: "gold" | "outline";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const res = await acceptQuote({ quoteId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/orders/${res.data.orderId}`);
    });
  }

  return (
    <Button type="button" variant={variant} size="xl" className="w-full" loading={pending} onClick={accept}>
      เลือกร้านนี้
    </Button>
  );
}

export function CloseRequestButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  function close() {
    startTransition(async () => {
      const res = await closeRequest({ requestId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ปิดคำขอแล้ว");
    });
  }

  return (
    <InlineConfirm
      triggerLabel="ปิดคำขอนี้"
      question="ปิดคำขอนี้ใช่ไหม ร้านจะไม่เห็นคำขอนี้และไม่สามารถเสนอราคาได้อีก"
      confirmLabel="ปิดคำขอ"
      confirmVariant="default"
      pending={pending}
      onConfirm={close}
    />
  );
}
