"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/chip";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ImageUpload } from "@/components/image-upload";
import { ThaiDateField } from "@/components/thai-date-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus } from "@/lib/constants";
import {
  addOrderEvent,
  confirmOrder,
  declineOrder,
  markOrderDone,
} from "@/server/actions/provider";
import { dayParts } from "../../day-utils";

/** แผงการทำงานของร้านตามสถานะคำสั่ง แสดงเฉพาะสถานะที่ร้านต้องดำเนินการ */
export function ProviderOrderActions({
  orderId,
  status,
  preferredDates = [],
  blockedDates = [],
}: {
  orderId: string;
  status: OrderStatus;
  /** วันที่ลูกค้าสะดวก (YYYY-MM-DD) ใช้เป็นทางลัดเลือกวันนัด */
  preferredDates?: string[];
  blockedDates?: string[];
}) {
  if (status === "AWAITING_PROVIDER") {
    return (
      <div className="flex flex-col gap-2">
        <ConfirmForm orderId={orderId} preferredDates={preferredDates} blockedDates={blockedDates} />
        <DeclineControl orderId={orderId} />
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="surface p-5">
        <ProgressForm orderId={orderId} />
        <DoneForm orderId={orderId} />
      </div>
    );
  }

  return null;
}

function todayBangkok(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function ConfirmForm({ orderId, preferredDates, blockedDates }: { orderId: string; preferredDates: string[]; blockedDates: string[] }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function confirm() {
    const when = date && time ? `${date}T${time}` : "";
    // ช่องให้ค่าเป็นเวลาไทยแบบ yyyy-mm-ddTHH:mm จึงต่อเขตเวลา +07:00 ก่อนส่ง
    const iso = `${when}:00+07:00`;
    const problem = when === ""
      ? "เลือกวันและเวลานัด"
      : blockedDates.includes(date)
        ? "ร้านปิดรับงานวันนี้ กรุณาเลือกวันอื่น"
      : !Number.isFinite(new Date(iso).getTime()) || new Date(iso).getTime() <= Date.now()
        ? "วันนัดต้องเป็นเวลาในอนาคต"
        : undefined;
    setError(problem);
    if (problem) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await confirmOrder({ orderId, scheduledAt: iso });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ยืนยันรับงานแล้ว");
    });
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4 surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        confirm();
      }}
    >
      <h2 className="font-display text-xl leading-snug font-normal">ยืนยันรับงาน</h2>

      {preferredDates.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">วันที่ลูกค้าสะดวก (แตะเพื่อใช้เป็นวันนัด)</p>
          <div className="flex flex-wrap gap-2">
            {preferredDates.map((date) => {
              const p = dayParts(`${date}T12:00:00+07:00`);
              return (
                <Chip
                  key={date}
                  onClick={() => {
                    setDate(date);
                    setTime("09:00");
                    setError(undefined);
                  }}
                >
                  {p.weekdayShort} {p.day} {p.month}
                </Chip>
              );
            })}
          </div>
        </div>
      ) : null}

      <div onClickCapture={() => setError(undefined)}>
        <Label htmlFor="scheduled-at" className="mb-2 text-base font-medium">
          วันและเวลานัด
        </Label>
        <div className="flex gap-3">
          <ThaiDateField id="scheduled-at" value={date} onChange={(value) => { setDate(value); setError(undefined); }}
            min={todayBangkok()} disabledDates={blockedDates}
            aria-invalid={Boolean(error)} aria-describedby="scheduled-at-hint" className="min-w-0 flex-1" />
          <Input type="time" aria-label="เวลานัด" value={time}
            onChange={(event) => { setTime(event.target.value); setError(undefined); }}
            aria-invalid={Boolean(error)} aria-describedby="scheduled-at-hint" className="w-32 shrink-0 px-4" />
        </div>
        <FieldHint id="scheduled-at-hint" error={error}>
          เลือกวันและเวลาที่ร้านไปทำงาน
        </FieldHint>
      </div>

      <Button type="submit" size="xl" variant="gold" loading={pending} className="w-full">
        ยืนยันรับงาน
      </Button>
    </form>
  );
}

function DeclineControl({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function decline() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("ระบุเหตุผลอย่างน้อย 3 ตัวอักษร");
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await declineOrder({ orderId, reason: trimmed });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ส่งการปฏิเสธงานแล้ว");
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xl"
        className="w-full text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        ไม่สามารถรับงานนี้
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4 surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        decline();
      }}
    >
      <div>
        <Label htmlFor="decline-reason" className="mb-2 text-base font-medium">
          เหตุผลที่ไม่รับงาน
        </Label>
        <Textarea
          id="decline-reason"
          placeholder="เช่น ช่วงนี้รับงานเต็มแล้ว"
          maxLength={500}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(undefined);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby="decline-reason-hint"
        />
        <FieldHint id="decline-reason-hint" error={error}>
          ลูกค้าจะเห็นเหตุผลนี้ และมัดจำจะรอการคืนจากทีมงาน
        </FieldHint>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" size="xl" onClick={() => setOpen(false)}>
          ยกเลิก
        </Button>
        <Button type="submit" variant="destructive" size="xl" loading={pending}>
          ยืนยันไม่รับงาน
        </Button>
      </div>
    </form>
  );
}

function ProgressForm({ orderId }: { orderId: string }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit() {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setError("กรอกหัวข้อความคืบหน้า");
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await addOrderEvent({
        orderId,
        title: trimmed,
        note: note.trim() || undefined,
        photoUrl: photos[0],
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกความคืบหน้าแล้ว");
      setTitle("");
      setNote("");
      setPhotos([]);
    });
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h2 className="font-display text-xl leading-snug font-normal">รายงานความคืบหน้า</h2>
      <div>
        <Label htmlFor="progress-title" className="mb-2 text-base font-medium">
          หัวข้อ
        </Label>
        <Input
          id="progress-title"
          placeholder="เช่น จัดส่งศาลถึงหน้างานแล้ว"
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(undefined);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby="progress-title-hint"
        />
        <FieldHint id="progress-title-hint" error={error}>
          ลูกค้าจะเห็นในความคืบหน้าของงาน
        </FieldHint>
      </div>
      <div>
        <Label htmlFor="progress-note" className="mb-2 text-base font-medium">
          รายละเอียด (ไม่บังคับ)
        </Label>
        <Textarea
          id="progress-note"
          rows={2}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-base font-medium">รูปประกอบ (ไม่บังคับ)</legend>
        <ImageUpload value={photos} onChange={setPhotos} max={1} label="เพิ่มรูป" />
      </fieldset>
      <Button type="submit" variant="secondary" size="xl" loading={pending} className="w-full">
        บันทึกความคืบหน้า
      </Button>
    </form>
  );
}

function DoneForm({ orderId }: { orderId: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function markDone() {
    startTransition(async () => {
      const res = await markOrderDone({ orderId, photoUrl: photos[0] });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("แจ้งว่างานเสร็จแล้ว");
    });
  }

  return (
    <form
      className="mt-6 flex flex-col gap-4 border-t border-border pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        markDone();
      }}
    >
      <h2 className="font-display text-xl leading-snug font-normal">ส่งงาน</h2>
      <fieldset>
        <legend className="mb-2 text-base font-medium">รูปงานที่เสร็จ (ไม่บังคับ)</legend>
        <ImageUpload value={photos} onChange={setPhotos} max={1} label="เพิ่มรูปงาน" />
      </fieldset>
      <Button type="submit" size="xl" variant="gold" loading={pending} className="w-full">
        แจ้งว่างานเสร็จ
      </Button>
      <p className="text-center text-sm text-muted-foreground">ลูกค้าจะตรวจรับงานและจ่ายส่วนที่เหลือ</p>
    </form>
  );
}
