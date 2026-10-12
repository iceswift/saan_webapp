"use client";

import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/chip";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ImageUpload } from "@/components/image-upload";
import { ThaiDateField } from "@/components/thai-date-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addCareLog } from "@/server/actions/extras";

const QUICK_PICKS = ["เปลี่ยนพวงมาลัย", "ทำความสะอาด", "ถวายของไหว้", "เปลี่ยนน้ำ"];

/** ฟอร์มจดการดูแลศาลด้วยตัวเอง วันที่เริ่มต้นเป็นวันนี้ และเลือกย้อนหลังได้ ช่องวางบนหน้าตรง ๆ ไม่อยู่ในการ์ด */
export function CareLogForm({ shrineId, today }: { shrineId: string; today: string }) {
  // หน้าเดสก์ท็อปแสดงฟอร์มนี้สองที่ (ในเนื้อหาสำหรับมือถือ และในแผงด้านข้าง) จึงต้องไม่ใช้ id ซ้ำกัน
  const uid = useId();
  const titleId = `${uid}-title`;
  const dateId = `${uid}-date`;
  const noteId = `${uid}-note`;
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [doneAt, setDoneAt] = useState(today);
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    const next: typeof errors = {};
    if (trimmed.length < 2) next.title = "กรุณากรอกสิ่งที่ทำ";
    if (!doneAt) next.date = "กรุณาเลือกวันที่ทำ";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await addCareLog({
        shrineId,
        title: trimmed,
        note: note.trim() || undefined,
        photoUrl: photos[0],
        doneAt,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกแล้ว");
      setTitle("");
      setNote("");
      setDoneAt(today);
      setPhotos([]);
    });
  }

  return (
    <form ref={formRef} onSubmit={save} noValidate className="flex flex-col gap-6">
      <div>
        <Label htmlFor={titleId} className="mb-2 text-base">
          สิ่งที่ทำ
        </Label>
        <Input
          id={titleId}
          maxLength={120}
          placeholder="เช่น เปลี่ยนพวงมาลัยสด"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((p) => ({ ...p, title: undefined }));
          }}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={`${titleId}-hint`}
        />
        <FieldHint id={`${titleId}-hint`} error={errors.title} />
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="เลือกเร็ว">
          {QUICK_PICKS.map((pick) => (
            <Chip
              key={pick}
              active={title === pick}
              onClick={() => {
                setTitle(pick);
                setErrors((p) => ({ ...p, title: undefined }));
              }}
            >
              {pick}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor={dateId} className="mb-2 text-base">
          วันที่ทำ
        </Label>
        <ThaiDateField
          id={dateId}
          max={today}
          value={doneAt}
          onChange={(v) => {
            setDoneAt(v);
            setErrors((p) => ({ ...p, date: undefined }));
          }}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={`${dateId}-hint`}
        />
        <FieldHint id={`${dateId}-hint`} error={errors.date}>
          ย้อนหลังได้
        </FieldHint>
      </div>

      <div>
        <Label htmlFor={noteId} className="mb-2 text-base">
          หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          id={noteId}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-base lg:min-h-20"
        />
      </div>

      <div>
        <p className="mb-2 text-base font-medium">
          รูปประกอบ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </p>
        <ImageUpload value={photos} onChange={setPhotos} max={1} label="เพิ่มรูป" />
      </div>

      <Button type="submit" variant="gold" size="xl" className="w-full" loading={pending}>
        บันทึก
      </Button>
    </form>
  );
}
