"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { SoonBadge } from "@/components/coming-soon";
import { focusFirstInvalid } from "@/components/field-hint";
import { ListGroup, ListRow } from "@/components/list-group";
import { Notice } from "@/components/notice";
import { TwoColumn } from "@/components/page-layout";
import { Rise } from "@/components/rise";
import { SampleBadge } from "@/components/sample-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShrineArt } from "@/components/visuals";
import {
  AREA_CODES,
  AREAS,
  PROVIDER_KINDS,
  type AreaCode,
  type ProviderKind,
} from "@/lib/constants";
import { FieldHint } from "@/components/field-hint";
import { SAMPLE_OPENING_HOURS } from "@/lib/mock/biz-tips";
import { registerProvider, updateProviderProfile } from "@/server/actions/provider";
import { Field, FormSection } from "./form-bits";
import { buildOptions, OptionCards, ToggleChips } from "./pickers";

const KIND_OPTIONS = buildOptions(PROVIDER_KINDS);
const AREA_OPTIONS = AREA_CODES.map((code) => ({ value: code, label: AREAS[code] }));

const AFTER_APPLY = [
  { label: "ส่งใบสมัคร", description: "กรอกข้อมูลร้านและพื้นที่ให้บริการ ใช้เวลาไม่กี่นาที" },
  { label: "ทีมงานตรวจสอบ", description: "ระหว่างนี้เพิ่มสินค้าและบริการของร้านไว้ก่อนได้" },
  { label: "เริ่มรับงาน", description: "เมื่อผ่านการตรวจสอบ ร้านจะแสดงให้ลูกค้าเห็นและรับงานได้" },
];

type Initial = {
  name: string;
  kind: ProviderKind | null;
  description: string;
  phone: string;
  areas: AreaCode[];
};

type Errors = { name?: string; kind?: string; phone?: string; areas?: string };

/** ฟอร์มสมัครผู้ให้บริการ (ทั้งหน้า) และฟอร์มแก้ไขข้อมูลร้าน (ในแท็บ) ใช้ฟิลด์ชุดเดียวกัน */
export function ProviderProfileForm({
  mode,
  initial,
}: {
  mode: "register" | "profile";
  initial: Initial;
}) {
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState<ProviderKind | null>(initial.kind);
  const [description, setDescription] = useState(initial.description);
  const [phone, setPhone] = useState(initial.phone);
  const [areas, setAreas] = useState<AreaCode[]>(initial.areas);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function save() {
    const trimmedName = name.trim();
    const next: Errors = {};
    if (trimmedName.length < 2) next.name = "กรอกชื่อร้านหรือชื่อผู้ให้บริการ";
    if (phone.replace(/\D/g, "").length < 9) next.phone = "กรอกเบอร์ติดต่อให้ครบ";
    if (!kind) next.kind = "เลือกประเภทผู้ให้บริการ";
    if (areas.length === 0) next.areas = "เลือกพื้นที่ให้บริการอย่างน้อย 1 พื้นที่";
    setErrors(next);
    if (Object.keys(next).length > 0 || !kind) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    const input = {
      name: trimmedName,
      kind,
      description: description.trim(),
      phone: phone.trim(),
      areas,
    };

    startTransition(async () => {
      const res =
        mode === "register" ? await registerProvider(input) : await updateProviderProfile(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "profile" ? "บันทึกแล้ว" : "ส่งใบสมัครแล้ว");
    });
  }

  const formId = "provider-profile-form";
  const fields = (
    <form
      id={formId}
      ref={formRef}
      noValidate
      className="flex max-w-2xl flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormSection title="ข้อมูลร้าน">
        <Field id="provider-name" label="ชื่อร้านหรือชื่อผู้ให้บริการ" error={errors.name}>
          <Input
            id="provider-name"
            placeholder="เช่น ร้านศาลพระภูมิบ้านช่างทอง"
            maxLength={100}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((s) => ({ ...s, name: undefined }));
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="provider-name-hint"
          />
        </Field>
        <Field id="provider-phone" label="เบอร์ติดต่อ" error={errors.phone}>
          <Input
            id="provider-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="08x-xxx-xxxx"
            className="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((s) => ({ ...s, phone: undefined }));
            }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby="provider-phone-hint"
          />
        </Field>
        <Field id="provider-description" label="แนะนำตัวสั้น ๆ" hint="ไม่บังคับ">
          <Textarea
            id="provider-description"
            placeholder="เล่าประสบการณ์หรือสิ่งที่ร้านถนัด"
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="ประเภทผู้ให้บริการ">
        <fieldset>
          <legend className="sr-only">ประเภท</legend>
          <OptionCards
            options={KIND_OPTIONS}
            value={kind}
            onChange={(v) => {
              setKind(v);
              setErrors((s) => ({ ...s, kind: undefined }));
            }}
            invalid={Boolean(errors.kind)}
            describedBy="provider-kind-hint"
          />
          <FieldHint id="provider-kind-hint" error={errors.kind} />
        </fieldset>
      </FormSection>

      <FormSection title="พื้นที่ให้บริการ">
        <fieldset>
          <legend className="sr-only">พื้นที่ให้บริการ</legend>
          <ToggleChips
            options={AREA_OPTIONS}
            value={areas}
            onChange={(v) => {
              setAreas(v);
              setErrors((s) => ({ ...s, areas: undefined }));
            }}
            invalid={Boolean(errors.areas)}
            describedBy="provider-areas-hint"
          />
          <FieldHint id="provider-areas-hint" error={errors.areas}>
            ร้านจะเห็นคำขอจากลูกค้าในพื้นที่ที่เลือก
          </FieldHint>
        </fieldset>
      </FormSection>
    </form>
  );

  if (mode === "register") {
    return (
      <AppShell
        width="full"
        footer={
          <Button type="submit" form={formId} size="xl" variant="gold" loading={pending} className="w-full">
            ส่งใบสมัคร
          </Button>
        }
      >
        <PageHeader title="สมัครเป็นผู้ให้บริการ" backHref="/account" backLabel="บัญชี" />

        <div className="mt-6 lg:mt-8">
          <TwoColumn
            asideOn="after"
            aside={
              <Rise i={1}>
                <aside aria-label="ขั้นตอนหลังสมัคร" className="flex flex-col items-center gap-6 lg:items-stretch">
                  <div
                    aria-hidden="true"
                    style={{ "--arch-r": "5.5rem" } as React.CSSProperties}
                    className="arch-top mx-auto flex h-48 w-44 items-end justify-center bg-muted pb-2"
                  >
                    <ShrineArt className="size-36" />
                  </div>
                  <div className="w-full">
                    <h2 className="text-base font-medium">หลังส่งใบสมัคร</h2>
                    <ol className="mt-3 flex flex-col divide-y divide-border border-y border-border">
                      {AFTER_APPLY.map((step, i) => (
                        <li key={step.label} className="flex gap-4 py-3">
                          <span className="numeric w-5 shrink-0 text-base text-muted-foreground">{i + 1}</span>
                          <div>
                            <p className="text-base font-medium">{step.label}</p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </aside>
              </Rise>
            }
          >
            <Rise i={0}>{fields}</Rise>
          </TwoColumn>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {fields}
      <Button type="submit" form={formId} size="xl" loading={pending} className="w-full sm:w-fit sm:px-12">
        บันทึก
      </Button>

      <section className="max-w-2xl border-t border-border pt-8">
        <h2 className="text-base font-medium">ตั้งค่าเพิ่มเติม</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">ส่วนนี้กำลังพัฒนา ยังบันทึกหรือใช้งานจริงไม่ได้</p>
        <ListGroup label="ตั้งค่าเพิ่มเติม">
          <li>
            <details className="group/hours">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 px-4 py-3 transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-medium">เวลาเปิดร้าน</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    ให้ลูกค้ารู้ว่าติดต่อได้ช่วงไหน
                  </span>
                </span>
                <SampleBadge />
              </summary>
              <ul className="divide-y divide-border border-t border-border px-4">
                {SAMPLE_OPENING_HOURS.map((day) => (
                  <li key={day.weekday} className="flex items-center justify-between gap-3 py-3 text-base">
                    <span>{day.weekday}</span>
                    <span className={day.closed ? "text-muted-foreground" : "numeric font-medium"}>
                      {day.hours}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
          <ListRow title="บัญชีรับเงิน" meta="บัญชีที่ร้านต้องการให้โอนเงินเข้า" trailing={<SoonBadge />} />
          <ListRow title="ทีมงานของร้าน" meta="เชิญช่างหรือผู้ช่วยมาดูแลงานร่วมกัน" trailing={<SoonBadge />} />
        </ListGroup>
      </section>

      <Notice tone="sky" className="max-w-2xl">
        การโอนเงินให้ร้านยังไม่เปิดใช้ ตอนนี้ระบบเป็นโหมดทดสอบ ยังไม่มีการตัดเงินจริง
      </Notice>
    </div>
  );
}
