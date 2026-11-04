"use client";

import { normalizeThaiPhone } from "@/lib/phone-input";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { SoonBadge } from "@/components/coming-soon";
import { focusFirstInvalid } from "@/components/field-hint";
import { ListGroup, ListRow } from "@/components/list-group";
import { ExpandableMap } from "@/components/map/expandable-map";
import { LocationPicker } from "@/components/map/location-picker";
import { Notice } from "@/components/notice";
import { TwoColumn } from "@/components/page-layout";
import { Rise } from "@/components/rise";
import { ShopPhotoField } from "./shop-photo-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShrineArt } from "@/components/visuals";
import type { LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  AREA_CODES,
  AREAS,
  PROVIDER_KINDS,
  type AreaCode,
  type ProviderKind,
} from "@/lib/constants";
import { FieldHint } from "@/components/field-hint";
import { registerProvider, updateProviderProfile } from "@/server/actions/provider";
import { Field, FormSection } from "./form-bits";
import { buildOptions, OptionCards, ToggleChips } from "./pickers";

const KIND_OPTIONS = buildOptions(PROVIDER_KINDS);
const AREA_OPTIONS = AREA_CODES.map((code) => ({ value: code, label: AREAS[code] }));

/** รัศมีให้บริการที่เลือกได้เร็ว ๆ (กม.) null = ไม่จำกัดตามระยะ */
const RADIUS_PRESETS: (number | null)[] = [10, 20, 40, 80, null];

const AFTER_APPLY = [
  { label: "ส่งใบสมัคร", description: "กรอกข้อมูลร้านและพื้นที่ให้บริการ ใช้เวลาไม่กี่นาที" },
  { label: "ทีมงานตรวจสอบ", description: "ระหว่างนี้เพิ่มสินค้าและบริการของร้านไว้ก่อนได้" },
  { label: "เริ่มรับงาน", description: "เมื่อผ่านการตรวจสอบ ร้านจะแสดงให้ลูกค้าเห็นและรับงานได้" },
];

type Initial = {
  name: string;
  kind: ProviderKind | null;
  description: string;
  publicAddress?: string;
  contactHours?: string;
  coverUrl?: string | null;
  phone: string;
  areas: AreaCode[];
  /** ที่ตั้งร้านที่บันทึกไว้ (เฉพาะแบบฟอร์มแก้ไข) */
  base?: LatLng | null;
  serviceRadiusKm?: number | null;
};

type Errors = { name?: string; kind?: string; phone?: string; areas?: string; radius?: string };

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
  const [publicAddress, setPublicAddress] = useState(initial.publicAddress ?? "");
  const [contactHours, setContactHours] = useState(initial.contactHours ?? "");
  const [cover, setCover] = useState<string | null>(initial.coverUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [description, setDescription] = useState(initial.description);
  const [phone, setPhone] = useState(initial.phone);
  const [areas, setAreas] = useState<AreaCode[]>(initial.areas);
  const [base, setBase] = useState<LatLng | null>(initial.base ?? null);
  const [radius, setRadius] = useState<number | null>(initial.serviceRadiusKm ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function save() {
    if (photoUploading || pending) return;
    const trimmedName = name.trim();
    const next: Errors = {};
    if (trimmedName.length < 2) next.name = "กรอกชื่อร้านหรือชื่อผู้ให้บริการ";
    const normalizedPhone = normalizeThaiPhone(phone);
    if (!/^0\d{9}$/.test(normalizedPhone)) next.phone = "กรอกเบอร์ติดต่อ 10 หลัก ขึ้นต้นด้วย 0";
    if (!kind) next.kind = "เลือกประเภทผู้ให้บริการ";
    if (areas.length === 0) next.areas = "เลือกพื้นที่ให้บริการอย่างน้อย 1 พื้นที่";
    if (mode === "profile" && radius !== null && !base) next.radius = "ปักหมุดที่ตั้งร้านก่อน จึงจะกำหนดรัศมีได้";
    setErrors(next);
    if (Object.keys(next).length > 0 || !kind) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    const input = {
      name: trimmedName,
      kind,
      description: description.trim(),
      publicAddress: publicAddress.trim(),
      contactHours: contactHours.trim(),
      coverUrl: cover,
      phone: normalizedPhone,
      areas,
    };
    // ส่วนแผนที่มีเฉพาะแบบฟอร์มแก้ไข (ตอนสมัครยังไม่ส่งค่านี้ เซิร์ฟเวอร์จะไม่แตะค่าเดิม)
    const profileInput =
      mode === "profile" ? { ...input, base, serviceRadiusKm: base ? radius : null } : input;

    startTransition(async () => {
      const res =
        mode === "register" ? await registerProvider(input) : await updateProviderProfile(profileInput);
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
      <FormSection title="รูปหน้าร้าน">
        <p className="text-sm text-muted-foreground">ไม่บังคับ รูปนี้จะแสดงบนหน้าร้านและแผนที่ เลือกรูปที่คุณมีสิทธิ์เผยแพร่</p>
        <ShopPhotoField value={cover} onChange={setCover} onBusyChange={setPhotoUploading} saving={pending} />
      </FormSection>
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

      <FormSection title="ที่อยู่สาธารณะของร้าน">
        <Field id="provider-public-address" label="ที่อยู่ที่ต้องการให้ลูกค้าเห็น" hint="ไม่บังคับ ข้อมูลนี้จะแสดงบนหน้าร้านและแผนที่รวมร้าน เว้นว่างเพื่อล้างที่อยู่ ไม่ต้องใส่ที่อยู่ส่วนตัวหากไม่ต้องการเผยแพร่">
          <Textarea id="provider-public-address" value={publicAddress} maxLength={500} rows={3}
            placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด และจุดสังเกต"
            onChange={event => setPublicAddress(event.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="ช่วงเวลาที่ติดต่อได้">
        <Field id="provider-contact-hours" label="วันและเวลาที่ลูกค้าติดต่อร้านได้" hint="ไม่บังคับ แสดงต่อสาธารณะ ไม่ใช่การจองคิว กรุณาระบุหากต้องนัดหมายก่อนเข้าร้าน">
          <Textarea id="provider-contact-hours" value={contactHours} maxLength={300} rows={3}
            placeholder="เช่น จันทร์–เสาร์ 09:00–17:00 น. กรุณาโทรนัดก่อนเข้าร้าน"
            onChange={event => setContactHours(event.target.value)} />
        </Field>
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

      {mode === "profile" ? (
        <FormSection title="ตำแหน่งร้านและรัศมีบริการ">
          <ExpandableMap
            title="ที่ตั้งร้านบนแผนที่"
            hint="ไม่บังคับ ช่วยให้ลูกค้าค้นหาร้านใกล้ตัวเจอ"
            hasPin={Boolean(base)}
            defaultOpen={Boolean(base)}
          >
            <LocationPicker
              value={base}
              onChange={(v) => {
                setBase(v);
                setErrors((s) => ({ ...s, radius: undefined }));
              }}
              circleKm={radius}
              height="20rem"
            />
          </ExpandableMap>

          <fieldset>
            <legend className="mb-2 text-base font-medium">รัศมีให้บริการ</legend>
            <div role="group" aria-label="รัศมีให้บริการ" className="flex flex-wrap gap-2">
              {[...new Set([...RADIUS_PRESETS, radius])].map((km) => {
                const on = radius === km;
                return (
                  <button
                    key={km ?? "none"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setRadius(km);
                      setErrors((s) => ({ ...s, radius: undefined }));
                    }}
                    className={cn(
                      "numeric inline-flex min-h-11 items-center rounded-full border px-5 text-base font-medium transition-colors lg:min-h-10",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/20 hover:bg-muted",
                    )}
                  >
                    {km === null ? "ไม่จำกัด" : `${km} กม.`}
                  </button>
                );
              })}
            </div>
            <FieldHint id="provider-radius-hint" error={errors.radius}>
              ลูกค้าที่อยู่นอกรัศมีจะสั่งไม่ได้ และร้านจะไม่แสดงเมื่อลูกค้าใช้ &quot;ใกล้ฉัน&quot;
            </FieldHint>
            <p className="mt-2 px-1 text-sm text-muted-foreground">
              ที่ตั้งร้านแสดงต่อสาธารณะเป็นหมุดโดยประมาณ (ปัดให้คลาดเคลื่อนราว 100 เมตร) ไม่แสดงตำแหน่งที่แน่นอน
            </p>
          </fieldset>
        </FormSection>
      ) : null}
    </form>
  );

  if (mode === "register") {
    return (
      <AppShell
        width="full"
        footer={
          <Button type="submit" form={formId} size="xl" variant="gold" loading={pending || photoUploading} className="w-full">
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
      <Button type="submit" form={formId} size="xl" loading={pending || photoUploading} className="w-full sm:w-fit sm:px-12">
        บันทึก
      </Button>

      <section className="max-w-2xl border-t border-border pt-8">
        <h2 className="text-base font-medium">ตั้งค่าเพิ่มเติม</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">ส่วนนี้กำลังพัฒนา ยังบันทึกหรือใช้งานจริงไม่ได้</p>
        <ListGroup label="ตั้งค่าเพิ่มเติม">
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
