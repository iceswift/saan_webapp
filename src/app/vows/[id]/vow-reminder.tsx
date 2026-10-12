"use client";

import { useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ThaiDateField } from "@/components/thai-date-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { setVowReminder } from "@/server/actions/extras";

/**
 * ตั้งวันเตือนของรายการในสมุดบน (ช่องอยู่บนหน้าตรง ๆ ไม่อยู่ในการ์ด)
 * remindText คือวันเตือนที่ตั้งไว้เป็น พ.ศ. (หรือ null) ส่วน remindDate และ minRemindAt เป็น YYYY-MM-DD ตามเวลาไทย
 * daysLeft คือจำนวนวันที่เหลือถึงวันเตือน คำนวณบนเซิร์ฟเวอร์ (ติดลบ = เลยวันมาแล้ว)
 */
export function VowReminder({
  vowId,
  remindText,
  remindDate,
  minRemindAt,
  daysLeft,
}: {
  vowId: string;
  remindText: string | null;
  remindDate: string;
  minRemindAt: string;
  daysLeft: number | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(remindDate);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const hasReminder = remindText !== null;

  function save() {
    if (!date) {
      setError("กรุณาเลือกวันที่ให้เตือน");
      requestAnimationFrame(() => focusFirstInvalid(rootRef.current));
      return;
    }
    if (date === remindDate) {
      setError("วันที่นี้ตั้งไว้แล้ว เลือกวันอื่นถ้าต้องการเปลี่ยน");
      requestAnimationFrame(() => focusFirstInvalid(rootRef.current));
      return;
    }
    startTransition(async () => {
      const res = await setVowReminder({ vowId, remindAt: date });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ตั้งวันเตือนแล้ว");
    });
  }

  function cancelReminder() {
    startTransition(async () => {
      const res = await setVowReminder({ vowId, remindAt: null });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDate("");
      toast.success("ยกเลิกการเตือนแล้ว");
    });
  }

  return (
    <section ref={rootRef}>
      <h2 className="font-display text-xl font-medium">เตือนความจำ</h2>
      <p className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
        <Bell className="size-4 shrink-0" aria-hidden="true" />
        {hasReminder ? (
          <>
            {remindText}
            {daysLeft !== null ? (
              <span className="numeric">
                {daysLeft < 0 ? " · เลยวันเตือนแล้ว" : daysLeft === 0 ? " · วันนี้" : ` · อีก ${daysLeft} วัน`}
              </span>
            ) : null}
          </>
        ) : (
          "ยังไม่ได้ตั้งวันเตือน"
        )}
      </p>

      <div className="mt-5">
        <Label htmlFor="remind-date" className="mb-2 text-base">
          {hasReminder ? "เปลี่ยนเป็นวันที่" : "เตือนฉันวันที่"}
        </Label>
        <ThaiDateField
          id="remind-date"
          min={minRemindAt}
          value={date}
          onChange={(v) => {
            setDate(v);
            setError(undefined);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby="remind-hint"
        />
        <FieldHint id="remind-hint" error={error}>
          เตือนในแอปเมื่อถึงวันนั้น
        </FieldHint>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button type="button" size="xl" className="w-full" loading={pending} onClick={save}>
          {hasReminder ? "เปลี่ยนวันเตือน" : "ตั้งวันเตือน"}
        </Button>
        {hasReminder ? (
          <Button
            type="button"
            variant="ghost"
            size="xl"
            className="w-full text-muted-foreground"
            disabled={pending}
            onClick={cancelReminder}
          >
            ยกเลิกการเตือน
          </Button>
        ) : null}
      </div>
    </section>
  );
}
