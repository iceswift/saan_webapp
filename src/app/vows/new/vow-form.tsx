"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ThaiDateField } from "@/components/thai-date-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVow } from "@/server/actions/customer";
import { ExpandableMap } from "@/components/map/expandable-map";
import { LocationPicker } from "@/components/map/location-picker";
import type { LatLng } from "@/lib/geo";

/** minRemindAt คือวันเตือนที่เร็วที่สุด (YYYY-MM-DD) คำนวณบนเซิร์ฟเวอร์ */
export function VowForm({ minRemindAt }: { minRemindAt: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [place, setPlace] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [wish, setWish] = useState("");
  const [promise, setPromise] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [errors, setErrors] = useState<{ place?: string; promise?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!place.trim()) next.place = "กรุณากรอกว่าบนไว้กับใคร ที่ไหน";
    if (!promise.trim()) next.promise = "กรุณากรอกสิ่งที่สัญญาว่าจะถวาย";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await createVow({
        place,
        location,
        wish: wish.trim() || undefined,
        promise,
        remindAt: remindAt || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/vows/${res.data.vowId}`);
    });
  }

  return (
    <AppShell
      width="narrow"
      footer={
        <Button type="submit" form="vow-form" variant="gold" size="xl" className="w-full" loading={pending}>
          บันทึก
        </Button>
      }
    >
      <PageHeader title="บันทึกการบนใหม่" subtitle="เห็นได้เฉพาะคุณ" backHref="/vows" backLabel="สมุดบน" />

      <form id="vow-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-7">
        <div>
          <Label htmlFor="place" className="mb-2 text-base">
            บนไว้กับใคร ที่ไหน
          </Label>
          <Input
            id="place"
            maxLength={200}
            placeholder="เช่น ศาลพระภูมิที่บ้าน"
            value={place}
            onChange={(e) => {
              setPlace(e.target.value);
              setErrors((p) => ({ ...p, place: undefined }));
            }}
            aria-invalid={Boolean(errors.place)}
            aria-describedby="place-hint"
          />
          <FieldHint id="place-hint" error={errors.place} />
          <ExpandableMap className="mt-4" hasPin={Boolean(location)} title="ปักหมุดสถานที่บน (ไม่บังคับ)" hint="จำตำแหน่งไว้เปิดเส้นทางเมื่อกลับมาแก้บน">
            <LocationPicker value={location} onChange={setLocation} />
            <p className="mt-3 text-sm text-muted-foreground">พิกัดบันทึกไว้ในสมุดส่วนตัว แยกจากชื่อสถานที่ด้านบน ไม่ต้องใช้ตำแหน่งปัจจุบันก็ปักหมุดได้</p>
          </ExpandableMap>
        </div>

        <div>
          <Label htmlFor="wish" className="mb-2 text-base">
            ขอเรื่องอะไร <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <Textarea
            id="wish"
            maxLength={500}
            placeholder="เช่น ขอให้สอบผ่าน"
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            className="text-base"
          />
        </div>

        <div>
          <Label htmlFor="promise" className="mb-2 text-base">
            สัญญาว่าจะถวายอะไร
          </Label>
          <Input
            id="promise"
            maxLength={500}
            placeholder="เช่น พวงมาลัย 9 พวง"
            value={promise}
            onChange={(e) => {
              setPromise(e.target.value);
              setErrors((p) => ({ ...p, promise: undefined }));
            }}
            aria-invalid={Boolean(errors.promise)}
            aria-describedby="promise-hint"
          />
          <FieldHint id="promise-hint" error={errors.promise} />
        </div>

        <div>
          <Label htmlFor="remindAt" className="mb-2 text-base">
            เตือนฉันวันที่ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <ThaiDateField id="remindAt" min={minRemindAt} value={remindAt} onChange={setRemindAt} aria-describedby="remind-hint" />
          <FieldHint id="remind-hint">เตือนในแอปเมื่อถึงวันนั้น</FieldHint>
        </div>
      </form>
    </AppShell>
  );
}
