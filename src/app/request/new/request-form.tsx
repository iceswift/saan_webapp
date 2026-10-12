"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ImageUpload } from "@/components/image-upload";
import { SidePanel, TwoColumn } from "@/components/page-layout";
import { ThumbArt } from "@/components/thumb-art";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AREAS, REQUEST_TYPES, SHRINE_KINDS, type AreaCode, type RequestType } from "@/lib/constants";
import type { AddressDTO, ShrineDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createRequest } from "@/server/actions/customer";
import { OptionCard } from "../option-card";

const PLACEHOLDER: Record<RequestType, string> = {
  REPAIR: "เช่น หลังคาแตก สีลอก ต้องการทาสีใหม่ทั้งหลัง",
  REMOVE: "เช่น ต้องการถอนศาลเก่าและนำไปส่งวัด เพราะจะรื้อบ้าน",
};

const TYPE_ART: Record<RequestType, "repair" | "move"> = { REPAIR: "repair", REMOVE: "move" };
const TYPES: RequestType[] = ["REPAIR", "REMOVE"];

type Errors = { description?: string; area?: string; address?: string };

export function RequestForm({
  type,
  shrines,
  addresses,
}: {
  type: RequestType;
  shrines: ShrineDTO[];
  addresses: AddressDTO[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<AreaCode | "">("");
  const [address, setAddress] = useState("");
  const [shrineId, setShrineId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  function clear(key: keyof Errors) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  // เลือกศาลแล้วเติมพื้นที่และที่อยู่จากศาลนั้น เฉพาะช่องที่ยังว่างอยู่
  function pickShrine(shrine: ShrineDTO) {
    setShrineId(shrine.id);
    if (!area) {
      setArea(shrine.area);
      clear("area");
    }
    if (!address.trim() && shrine.address) {
      setAddress(shrine.address);
      clear("address");
    }
  }

  // ที่อยู่ที่บันทึกไว้เติมทั้งพื้นที่และที่อยู่ในครั้งเดียว
  function pickSavedAddress(saved: AddressDTO) {
    setArea(saved.area);
    setAddress(saved.address);
    setErrors((prev) => ({ ...prev, area: undefined, address: undefined }));
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const next: Errors = {};
    if (description.trim().length < 10) next.description = "อธิบายงานที่ต้องการอย่างน้อย 10 ตัวอักษร";
    if (!area) next.area = "กรุณาเลือกพื้นที่";
    if (address.trim().length < 5) next.address = "กรุณากรอกที่อยู่";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await createRequest({
        type,
        description,
        area,
        address,
        photoUrls,
        shrineId: shrineId ?? undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/requests/${res.data.requestId}`);
    });
  }

  const promise = "ส่งคำขอแล้วยังไม่ต้องจ่ายเงิน คุณเปรียบเทียบใบเสนอราคาและเลือกร้านเมื่อพร้อม";

  return (
    <AppShell
      width="full"
      desktopFooter="hide"
      footer={
        <Button type="submit" form="request-form" variant="gold" size="xl" className="w-full" loading={pending}>
          ส่งคำขอ
        </Button>
      }
    >
      <PageHeader title="ขอใบเสนอราคา" backHref="/" backLabel="หน้าแรก" />

      <TwoColumn
        asideOn="hide"
        aside={
          <SidePanel>
            <p className="text-base">{promise}</p>
            <Button
              type="submit"
              form="request-form"
              variant="gold"
              size="xl"
              className="mt-5 hidden w-full lg:inline-flex"
              loading={pending}
            >
              ส่งคำขอ
            </Button>
          </SidePanel>
        }
      >
        <form id="request-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col">
          <fieldset>
            <legend className="sr-only">ประเภทงาน</legend>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((code) => (
                <Link
                  key={code}
                  href={`/request/new?type=${code}`}
                  replace
                  scroll={false}
                  aria-current={type === code ? "true" : undefined}
                  className={cn(
                    "surface flex min-h-18 items-center gap-3 p-3 text-base font-medium transition-colors hover:bg-muted",
                    type === code && "border-primary",
                  )}
                >
                  <ThumbArt service={TYPE_ART[code]} size="sm" />
                  <span className="min-w-0 flex-1 leading-snug">{REQUEST_TYPES[code]}</span>
                </Link>
              ))}
            </div>
          </fieldset>

          <SectionTitle className="mt-8 lg:mt-10">รูปศาลและบริเวณ</SectionTitle>
          <ImageUpload value={photoUrls} onChange={setPhotoUrls} max={6} label="เพิ่มรูป" />
          <FieldHint>ไม่บังคับ แต่รูปที่ชัดช่วยให้ร้านเสนอราคาได้แม่นขึ้น</FieldHint>

          <SectionTitle className="mt-8 lg:mt-10">งานที่ต้องการ</SectionTitle>
          <Label htmlFor="description" className="sr-only">
            อธิบายงานที่ต้องการ
          </Label>
          <Textarea
            id="description"
            maxLength={2000}
            placeholder={PLACEHOLDER[type]}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clear("description");
            }}
            aria-invalid={Boolean(errors.description)}
            aria-describedby="description-hint"
            className="text-base"
          />
          <FieldHint id="description-hint" error={errors.description}>
            เล่าสภาพศาลและสิ่งที่อยากให้ทำ
          </FieldHint>

          <SectionTitle className="mt-8 lg:mt-10">สถานที่</SectionTitle>
          {addresses.length > 0 ? (
            <div className="mb-6 flex flex-col gap-3 lg:grid lg:grid-cols-2">
              {addresses.map((saved) => (
                <OptionCard
                  key={saved.id}
                  selected={area === saved.area && address === saved.address}
                  onSelect={() => pickSavedAddress(saved)}
                  title={saved.label}
                  description={`${AREAS[saved.area]} · ${saved.address.split(/\r?\n/)[0]}`}
                />
              ))}
            </div>
          ) : null}

          <fieldset aria-invalid={Boolean(errors.area)} aria-describedby="area-hint" tabIndex={-1} className="outline-none">
            <legend className="mb-3 text-base font-medium">พื้นที่</legend>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(AREAS) as AreaCode[]).map((code) => (
                <OptionCard
                  key={code}
                  selected={area === code}
                  onSelect={() => {
                    setArea(code);
                    clear("area");
                  }}
                  title={AREAS[code]}
                />
              ))}
            </div>
            <FieldHint id="area-hint" error={errors.area} />
          </fieldset>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="address" className="text-base">
                ที่อยู่
              </Label>
              <Link
                href="/settings/addresses"
                className="inline-flex min-h-11 items-center rounded-full px-3 text-base font-medium underline underline-offset-4 hover:bg-muted"
              >
                จัดการที่อยู่
              </Link>
            </div>
            <Textarea
              id="address"
              maxLength={500}
              placeholder="บ้านเลขที่ หมู่บ้าน หรือจุดสังเกต"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                clear("address");
              }}
              aria-invalid={Boolean(errors.address)}
              aria-describedby="address-hint"
              className="text-base"
            />
            <FieldHint id="address-hint" error={errors.address} className="mt-0" />
          </div>

          {shrines.length > 0 ? (
            <>
              <SectionTitle className="mt-8 lg:mt-10">เกี่ยวกับศาลไหน</SectionTitle>
              <fieldset>
                <legend className="sr-only">เกี่ยวกับศาลไหน</legend>
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
                  {shrines.map((shrine) => (
                    <OptionCard
                      key={shrine.id}
                      selected={shrineId === shrine.id}
                      onSelect={() => pickShrine(shrine)}
                      leading={<ThumbArt kind={shrine.kind} src={shrine.photoUrl} size="sm" />}
                      title={shrine.name}
                      description={SHRINE_KINDS[shrine.kind]}
                    />
                  ))}
                  <OptionCard selected={shrineId === null} onSelect={() => setShrineId(null)} title="ไม่ระบุ" />
                </div>
              </fieldset>
            </>
          ) : null}

          <p className="mt-8 text-base text-muted-foreground lg:hidden">{promise}</p>
        </form>
      </TwoColumn>
    </AppShell>
  );
}
