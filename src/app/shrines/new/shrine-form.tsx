"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ImageUpload } from "@/components/image-upload";
import { ThaiDateField } from "@/components/thai-date-field";
import { ThumbArt } from "@/components/visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AREAS, SHRINE_KINDS, type AreaCode, type ShrineKind } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createShrine } from "@/server/actions/customer";

/** วันที่วันนี้ตามเวลาไทย รูปแบบ YYYY-MM-DD ใช้เป็นวันสูงสุดของช่องวันที่ตั้งศาล */
function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

/** ตัวเลือกแตะง่าย ไม่มีไอคอนในวงกลม: ประเภทศาลมีภาพวาดของศาลนั้น พื้นที่เป็นข้อความล้วน */
function Choice({
  selected,
  onSelect,
  thumb,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  thumb?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "surface flex min-h-14 w-full items-center gap-4 p-3 text-left text-base font-medium transition-colors",
        thumb ? "pr-4" : "px-5",
        selected ? "border-primary" : "hover:bg-muted",
      )}
    >
      {thumb}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function ShrineForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ShrineKind | "">("");
  const [area, setArea] = useState<AreaCode | "">("");
  const [address, setAddress] = useState("");
  const [installedAt, setInstalledAt] = useState("");
  const [maxDate] = useState(todayInBangkok);
  const [errors, setErrors] = useState<{ name?: string; kind?: string; area?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "กรุณากรอกชื่อเรียกศาล";
    if (!kind) next.kind = "กรุณาเลือกประเภทศาล";
    if (!area) next.area = "กรุณาเลือกพื้นที่";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await createShrine({
        name,
        kind,
        area,
        address: address.trim() || undefined,
        photoUrl: photoUrls[0] || undefined,
        installedAt: installedAt || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push("/shrines");
    });
  }

  return (
    <AppShell
      width="narrow"
      footer={
        <Button type="submit" form="shrine-form" size="xl" className="w-full" loading={pending}>
          บันทึก
        </Button>
      }
    >
      <PageHeader title="เพิ่มศาลที่มีอยู่" backHref="/shrines" backLabel="ศาลของฉัน" />

      <form id="shrine-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-8">
        <div>
          <Label htmlFor="name" className="mb-2 text-base">
            ชื่อเรียกศาล
          </Label>
          <Input
            id="name"
            maxLength={100}
            placeholder="เช่น ศาลพระภูมิหน้าบ้าน"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="name-hint"
          />
          <FieldHint id="name-hint" error={errors.name} />
        </div>

        <fieldset aria-describedby="kind-hint">
          <legend className="mb-3 text-base font-medium">ประเภทศาล</legend>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2" aria-invalid={Boolean(errors.kind)} tabIndex={-1} id="kind">
            {(Object.keys(SHRINE_KINDS) as ShrineKind[]).map((code) => (
              <Choice
                key={code}
                selected={kind === code}
                onSelect={() => {
                  setKind(code);
                  setErrors((p) => ({ ...p, kind: undefined }));
                }}
                thumb={<ThumbArt kind={code} size="sm" />}
              >
                {SHRINE_KINDS[code]}
              </Choice>
            ))}
          </div>
          <FieldHint id="kind-hint" error={errors.kind} />
        </fieldset>

        <fieldset aria-describedby="area-hint">
          <legend className="mb-3 text-base font-medium">พื้นที่</legend>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2" aria-invalid={Boolean(errors.area)} tabIndex={-1} id="area">
            {(Object.keys(AREAS) as AreaCode[]).map((code) => (
              <Choice
                key={code}
                selected={area === code}
                onSelect={() => {
                  setArea(code);
                  setErrors((p) => ({ ...p, area: undefined }));
                }}
              >
                {AREAS[code]}
              </Choice>
            ))}
          </div>
          <FieldHint id="area-hint" error={errors.area} />
        </fieldset>

        <div>
          <Label htmlFor="installedAt" className="mb-2 text-base">
            วันที่ตั้งศาล <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <ThaiDateField id="installedAt" max={maxDate} value={installedAt} onChange={setInstalledAt} />
        </div>

        <div>
          <Label htmlFor="address" className="mb-2 text-base">
            ที่อยู่ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <Textarea
            id="address"
            maxLength={500}
            placeholder="บ้านเลขที่ หมู่บ้าน หรือจุดสังเกต"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="text-base"
          />
        </div>

        <div>
          <p className="mb-2 text-base font-medium">
            รูปศาล <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </p>
          <ImageUpload value={photoUrls} onChange={setPhotoUrls} max={1} label="เพิ่มรูปศาล" />
        </div>
      </form>
    </AppShell>
  );
}
