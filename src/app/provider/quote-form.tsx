"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/components/field-hint";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendQuote } from "@/server/actions/provider";
import { Field, PriceField, priceError } from "./form-bits";

/** ฟอร์มส่งหรือแก้ไขใบเสนอราคาในคำขอหนึ่งรายการ (ปุ่มกดได้เสมอ ตรวจตอนกด) */
export function QuoteForm({
  requestId,
  myQuote,
}: {
  requestId: string;
  myQuote: { price: number; note: string } | null;
}) {
  const [priceText, setPriceText] = useState(myQuote ? String(myQuote.price) : "");
  const [note, setNote] = useState(myQuote?.note ?? "");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function send() {
    const problem = priceError(priceText);
    setError(problem);
    if (problem) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    startTransition(async () => {
      const res = await sendQuote({ requestId, price: Number(priceText), note: note.trim() });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ส่งใบเสนอราคาแล้ว");
    });
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <PriceField
        id={`price-${requestId}`}
        label="ราคาที่เสนอ (บาท)"
        value={priceText}
        onChange={(v) => {
          setPriceText(v);
          setError(undefined);
        }}
        placeholder="เช่น 3500"
        error={error}
      />
      <Field id={`note-${requestId}`} label="รายละเอียดที่รวมในราคา">
        <Textarea
          id={`note-${requestId}`}
          placeholder="เช่น ค่าแรง ค่าขนส่ง และของถวาย"
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <Button type="submit" size="xl" loading={pending} className="w-full sm:w-fit">
        <Send />
        {myQuote ? "บันทึกใบเสนอราคา" : "ส่งใบเสนอราคา"}
      </Button>
    </form>
  );
}
