"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Chip } from "@/components/chip";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { Price } from "@/components/price";
import { PriceTicker } from "@/components/price-ticker";
import { TwoColumn } from "@/components/page-layout";
import { Rise } from "@/components/rise";
import { ExpandableMap } from "@/components/map/expandable-map";
import { LocationPicker } from "@/components/map/location-picker";
import { ThaiDateField } from "@/components/thai-date-field";
import { FlashOnChange } from "@/components/track-flash";
import { TrustNote } from "@/components/trust-note";
import { ThumbArt } from "@/components/visuals";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PACKAGE_ART } from "@/app/shops/public-parts";
import { ChoiceCard } from "../choice-card";
import {
  AREAS,
  DEPOSIT_RATE,
  PLACE_TYPES,
  PLACE_TYPE_CODES,
  type AreaCode,
  type PlaceType,
} from "@/lib/constants";
import { formatBaht, formatDateOnly } from "@/lib/format";
import type { LatLng } from "@/lib/geo";
import type { AddressDTO, ProductDetail } from "@/lib/types";
import { createInstallOrder } from "@/server/actions/orders";
import { saveAddress } from "@/server/actions/settings";

const FORM_ID = "checkout-form";

type Errors = {
  date?: string;
  backupDate?: string;
  address?: string;
  area?: string;
  place?: string;
};

/** บรรทัดแรกของที่อยู่ ใช้เป็นคำอธิบายสั้นในตัวเลือก */
function firstLine(text: string): string {
  return text.split(/\r?\n/)[0] ?? text;
}

/**
 * หัวข้อส่วนของฟอร์ม: เมื่อกรอกครบแสดงเครื่องหมายถูกและสรุปหนึ่งบรรทัด
 * (ไม่พับเนื้อหาส่วนที่ครบแล้ว เพื่อให้ช่องกรอกทุกช่องยังอยู่ในลำดับแท็บและโปรแกรมอ่านหน้าจอเสมอ)
 */
function SectionHeading({
  n,
  done = false,
  recap,
  children,
}: {
  n: number;
  done?: boolean;
  recap?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mt-10 mb-4 flex items-baseline gap-3 font-display text-xl font-medium text-balance lg:mt-12">
      <span aria-hidden="true" className="numeric text-base text-muted-foreground">
        {n}
      </span>
      <span className="min-w-0">{children}</span>
      {done ? (
        <span className="ml-auto flex shrink-0 items-center gap-2 self-center font-sans text-sm font-normal text-muted-foreground">
          {recap ? <span className="numeric max-w-[10rem] truncate max-sm:hidden">{recap}</span> : null}
          <span className="animate-pop flex size-5 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
            <span className="sr-only">กรอกครบแล้ว</span>
          </span>
        </span>
      ) : null}
    </h2>
  );
}

export function CheckoutForm({
  product,
  area: initialArea,
  place: initialPlace,
  minDate,
  backHref,
  backLabel,
  savedAddresses,
  blockedDates,
  testMode,
}: {
  product: ProductDetail;
  /** พื้นที่จากตัวช่วย/หน้าศาล (null = ยังไม่รู้ ถามในหน้านี้) */
  area: AreaCode | null;
  place: PlaceType | null;
  /** วันที่เร็วที่สุดที่เลือกได้ (พรุ่งนี้ตามเวลาไทย) */
  minDate: string;
  backHref: string;
  backLabel: string;
  /** ที่อยู่ที่บันทึกไว้ในพื้นที่ที่ร้านให้บริการ ที่อยู่หลักอยู่ก่อน */
  savedAddresses: AddressDTO[];
  /** วันที่ร้านปิดรับงาน (YYYY-MM-DD) */
  blockedDates: string[];
  testMode: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const providerAreas = product.provider.areas;

  // ที่อยู่ตั้งต้น: ที่อยู่หลักที่อยู่ในพื้นที่ที่เลือกมาแล้ว (ถ้ายังไม่เลือกพื้นที่ ใช้ที่อยู่หลักของลูกค้า)
  const initialSaved =
    savedAddresses.find((a) => a.isDefault && (!initialArea || a.area === initialArea)) ??
    savedAddresses.find((a) => !initialArea || a.area === initialArea);

  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [backupDate, setBackupDate] = useState("");
  const [address, setAddress] = useState(initialSaved?.address ?? "");
  const [chosenArea, setChosenArea] = useState<AreaCode | null>(
    initialSaved?.area ?? initialArea ?? (providerAreas.length === 1 ? providerAreas[0] : null),
  );
  const [place, setPlace] = useState<PlaceType | null>(initialPlace);
  const [note, setNote] = useState("");
  const [saveForLater, setSaveForLater] = useState(false);
  const [geo, setGeo] = useState<LatLng | null>(initialSaved?.location ?? null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [navigating, setNavigating] = useState(false);

  const chosen = product.packages.filter((p) => selected.includes(p.id));
  const total = product.price + chosen.reduce((sum, p) => sum + p.price, 0);
  const deposit = Math.round(total * DEPOSIT_RATE);
  const remaining = total - deposit;

  // ที่อยู่ตรงกับที่บันทึกไว้ -> พื้นที่ถูกกำหนดจากที่อยู่นั้น ไม่ต้องถามจังหวัดซ้ำ
  const trimmedAddress = address.trim();
  const matchedSaved = savedAddresses.find((a) => a.address.trim() === trimmedAddress);
  const area = matchedSaved?.area ?? chosenArea;
  const areaFixed = Boolean(matchedSaved) || providerAreas.length === 1;
  const canSave = trimmedAddress.length > 0 && !matchedSaved && area !== null;
  function dateProblem(value: string): string | undefined {
    if (value < minDate) return "กรุณาเลือกวันพรุ่งนี้เป็นต้นไป";
    if (blockedDates.includes(value)) return "ร้านไม่ว่างวันนี้ กรุณาเลือกวันอื่น";
    return undefined;
  }

  const dateDone = date !== "" && !dateProblem(date) && (!backupDate || !dateProblem(backupDate));
  const locationDone = trimmedAddress.length >= 5 && area !== null && place !== null;

  function clearError(key: keyof Errors) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function togglePackage(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function pickSaved(saved: AddressDTO) {
    setAddress(saved.address);
    setChosenArea(saved.area);
    setGeo(saved.location ?? null);
    setGeoError(null);
    clearError("address");
    clearError("area");
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || navigating) return;
    const next: Errors = {};
    next.date = date ? dateProblem(date) : "กรุณาเลือกวันที่ต้องการ";
    if (backupDate) next.backupDate = dateProblem(backupDate);
    if (trimmedAddress.length < 5) next.address = "กรุณากรอกที่อยู่ที่จะตั้งศาล";
    if (!area) next.area = "กรุณาเลือกพื้นที่";
    if (!place) next.place = "กรุณาเลือกประเภทสถานที่";
    setErrors(next);
    if (Object.values(next).some(Boolean) || !area || !place) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    const preferredDates = [...new Set([date, backupDate].filter((d) => d !== ""))];
    // ตรวจผ่านแล้ว: เตรียมหน้างานของฉันไว้ก่อน หน้ารายละเอียดคำสั่งเตรียมทันทีที่รู้เลขที่
    router.prefetch("/orders");
    startTransition(async () => {
      const res = await createInstallOrder({
        productId: product.id,
        packageIds: selected,
        placeType: place,
        area,
        address,
        preferredDates,
        note,
        ...(geo ? { geo } : {}),
      });
      if (!res.ok) {
        if (res.error.includes("รัศมี")) {
          setGeoError(res.error);
          requestAnimationFrame(() => focusFirstInvalid(formRef.current));
        } else {
          toast.error(res.error);
        }
        return;
      }
      // บันทึกที่อยู่ไว้ใช้ครั้งหน้า ความล้มเหลวของส่วนนี้ไม่กระทบคำสั่งซื้อ
      if (saveForLater && canSave) {
        try {
          await saveAddress({ label: "ที่อยู่ตั้งศาล", area, address, ...(geo ? { geo } : {}) });
        } catch {
          // ไม่ต้องแจ้งลูกค้า เพราะคำสั่งซื้อสำเร็จแล้ว
        }
      }
      // ปุ่มคงสถานะกำลังยืนยันไว้จนกว่าจะเปลี่ยนหน้า (ไม่กระพริบกลับเป็นปุ่มปกติ)
      setNavigating(true);
      router.prefetch(`/orders/${res.data.orderId}`);
      router.push(`/orders/${res.data.orderId}`);
    });
  }

  const busy = pending || navigating;
  const confirmLabel = `ยืนยันคำสั่งซื้อ · ${formatBaht(total)}`;
  const sectionOffset = product.packages.length > 0 ? 1 : 0;

  return (
    <AppShell
      width="full"
      desktopFooter="hide"
      footer={
        <Button type="submit" form={FORM_ID} variant="gold" size="xl" loading={busy} className="w-full">
          {busy ? "กำลังยืนยัน" : confirmLabel}
        </Button>
      }
    >
      <PageHeader title="ยืนยันคำสั่งซื้อ" backHref={backHref} backLabel={backLabel} />
      <p className="mb-6 max-w-xl text-base text-muted-foreground">
        สร้างคำสั่งซื้อก่อน แล้วจ่ายมัดจำในขั้นตอนถัดไป
      </p>

      <TwoColumn
        className="lg:mt-6"
        aside={
          <div>
            <section aria-labelledby="summary-title" className="surface p-5 lg:p-6">
              <h2 id="summary-title" className="font-display text-xl font-medium">
                สรุปคำสั่งซื้อ
              </h2>

              <div className="mt-4 flex items-center gap-3 border-b border-border pb-4">
                <ThumbArt kind={product.kind} src={product.imageUrl} size="md" />
                <div className="min-w-0">
                  <p className="text-base leading-snug font-medium">{product.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{product.provider.name}</p>
                </div>
              </div>

              <dl className="mt-4 flex flex-col gap-3 text-base">
                <SummaryLine label="ค่าศาล" value={formatBaht(product.price)} />
                {chosen.map((pkg) => (
                  <SummaryLine key={pkg.id} label={pkg.name} value={formatBaht(pkg.price)} flashOnMount />
                ))}
              </dl>

              <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4">
                <span className="text-base font-medium">ยอดรวม</span>
                <FlashOnChange value={total} className="-mx-2 px-2 py-0.5">
                  <PriceTicker amount={total} size="lg" />
                </FlashOnChange>
              </div>

              <dl className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-base font-medium">
                    จ่ายมัดจำ {Math.round(DEPOSIT_RATE * 100)}%
                  </dt>
                  <dd>
                    <FlashOnChange value={deposit} className="-mx-2 px-2 py-0.5">
                      <PriceTicker amount={deposit} size="md" emphasis />
                    </FlashOnChange>
                  </dd>
                </div>
                <SummaryLine label="ส่วนที่เหลือ จ่ายเมื่อตรวจรับงาน" value={formatBaht(remaining)} />
              </dl>

              <Button
                type="submit"
                form={FORM_ID}
                variant="gold"
                size="xl"
                loading={busy}
                className="mt-5 hidden w-full lg:inline-flex"
              >
                {busy ? "กำลังยืนยัน" : confirmLabel}
              </Button>
            </section>

            <TrustNote testMode={testMode} className="mt-4" />
          </div>
        }
      >
        <Rise>
          <form id={FORM_ID} ref={formRef} onSubmit={submit} noValidate className="flex flex-col">
            {/* มือถือ: ศาลที่เลือกอยู่บนสุด (เดสก์ท็อปอยู่ในแผงสรุป) */}
            <div className="flex items-center gap-4 lg:hidden">
              <ThumbArt kind={product.kind} src={product.imageUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-base leading-snug font-medium text-balance">{product.name}</p>
                <p className="truncate text-sm text-muted-foreground">{product.provider.name}</p>
                <Price amount={product.price} size="md" className="mt-1" />
              </div>
            </div>

            {product.packages.length > 0 ? (
              <section>
                <SectionHeading n={1} done={selected.length > 0} recap={`เลือก ${selected.length} รายการ`}>
                  เพิ่มพิธีและบริการ (ไม่บังคับ)
                </SectionHeading>
                <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
                  {product.packages.map((pkg) => (
                    <ChoiceCard
                      key={pkg.id}
                      multi
                      selected={selected.includes(pkg.id)}
                      onSelect={() => togglePackage(pkg.id)}
                      leading={<ThumbArt service={PACKAGE_ART[pkg.type]} size="sm" />}
                      title={pkg.name}
                      description={`${pkg.description ? `${pkg.description} · ` : ""}เพิ่ม ${formatBaht(pkg.price)}`}
                      className="min-h-20"
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4 lg:hidden">
                  <span className="text-base text-muted-foreground">ยอดรวมตอนนี้</span>
                  <PriceTicker amount={total} size="lg" />
                </div>
              </section>
            ) : null}

            <section>
              <SectionHeading n={1 + sectionOffset} done={dateDone} recap={dateDone ? formatDateOnly(date) : undefined}>
                วันที่สะดวก
              </SectionHeading>
              <div className="flex flex-col gap-5 xl:grid xl:grid-cols-2 xl:gap-4">
                <div>
                  <Label htmlFor="date" className="mb-2 text-base">
                    วันที่ต้องการ
                  </Label>
                  <ThaiDateField
                    id="date"
                    name="date"
                    value={date}
                    min={minDate}
                    disabledDates={blockedDates}
                    onChange={(v) => {
                      setDate(v);
                      clearError("date");
                    }}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby="date-hint"
                  />
                  <FieldHint id="date-hint" error={errors.date}>
                    ร้านจะยืนยันวันและเวลาฤกษ์จากวันที่คุณเลือก
                  </FieldHint>
                </div>
                <div>
                  <Label htmlFor="backup-date" className="mb-2 text-base">
                    วันสำรอง (ไม่บังคับ)
                  </Label>
                  <ThaiDateField
                    id="backup-date"
                    name="backupDate"
                    value={backupDate}
                    min={minDate}
                    disabledDates={blockedDates}
                    onChange={(value) => {
                      setBackupDate(value);
                      clearError("backupDate");
                    }}
                    placeholder="เลือกวันสำรอง"
                    aria-invalid={Boolean(errors.backupDate)}
                    aria-describedby="backup-date-hint"
                  />
                  <FieldHint id="backup-date-hint" error={errors.backupDate} />
                </div>
              </div>
              {blockedDates.length > 0 ? (
                <p className="mt-3 px-1 text-sm text-muted-foreground">
                  ร้านนี้ปิดรับงานบางวัน (แสดงในปฏิทินแล้ว)
                </p>
              ) : null}
            </section>

            <section>
              <SectionHeading n={2 + sectionOffset} done={locationDone} recap={locationDone && area ? AREAS[area] : undefined}>
                ที่ตั้งศาล
              </SectionHeading>

              {savedAddresses.length > 0 ? (
                <div className="mb-6 flex flex-col gap-3">
                  {savedAddresses.map((saved) => (
                    <ChoiceCard
                      key={saved.id}
                      selected={address.trim() === saved.address.trim()}
                      onSelect={() => pickSaved(saved)}
                      title={saved.label}
                      description={`${AREAS[saved.area]} · ${firstLine(saved.address)}`}
                    />
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="address" className="text-base">
                  ที่อยู่โดยละเอียด
                </Label>
                <Link
                  href="/settings/addresses"
                  className="inline-flex min-h-11 items-center text-base font-medium underline underline-offset-4"
                >
                  จัดการที่อยู่
                </Link>
              </div>
              <Textarea
                id="address"
                maxLength={500}
                placeholder="บ้านเลขที่ ซอย ถนน ตำบลหรือแขวง อำเภอหรือเขต"
                value={address}
                onChange={(e) => {
                  const nextAddress = e.target.value;
                  const saved = savedAddresses.find((a) => a.address.trim() === nextAddress.trim());
                  // A changed address must not carry the previous home's coordinates.
                  if (nextAddress.trim() !== trimmedAddress) {
                    setGeo(saved?.location ?? null);
                    setGeoError(null);
                  }
                  if (saved) setChosenArea(saved.area);
                  else if (matchedSaved) setChosenArea(matchedSaved.area);
                  setAddress(nextAddress);
                  clearError("address");
                  clearError("area");
                }}
                aria-invalid={Boolean(errors.address)}
                aria-describedby="address-hint"
              />
              <FieldHint id="address-hint" error={errors.address} />

              <div id="geo-section" tabIndex={-1} aria-invalid={Boolean(geoError)} aria-describedby="geo-hint" className="mt-4">
                <ExpandableMap hasPin={Boolean(geo)}>
                  <LocationPicker
                    value={geo}
                    onChange={(v) => {
                      setGeo(v);
                      setGeoError(null);
                    }}
                    provider={{
                      location: product.provider.location,
                      serviceRadiusKm: product.provider.serviceRadiusKm,
                    }}
                  />
                </ExpandableMap>
                <FieldHint id="geo-hint" error={geoError} />
              </div>

              {canSave ? (
                <div className="mt-1 flex min-h-11 items-center gap-3">
                  <input
                    id="save-address"
                    type="checkbox"
                    checked={saveForLater}
                    onChange={(e) => setSaveForLater(e.target.checked)}
                    className="size-5 shrink-0 accent-primary"
                  />
                  <Label htmlFor="save-address" className="text-base font-normal">
                    บันทึกที่อยู่นี้ไว้ใช้ครั้งหน้า
                  </Label>
                </div>
              ) : null}

              {/* พื้นที่: ถ้ามาจากที่อยู่ที่บันทึกไว้หรือร้านมีพื้นที่เดียว ไม่ต้องถามซ้ำ */}
              <div className="mt-6">
                {areaFixed && area ? (
                  <p className="text-base">
                    <span className="text-muted-foreground">พื้นที่ </span>
                    <span className="font-medium">{AREAS[area]}</span>
                  </p>
                ) : (
                  <div
                    tabIndex={-1}
                    aria-invalid={Boolean(errors.area)}
                    aria-describedby="area-hint"
                    className="outline-none"
                  >
                    <p className="mb-2 text-base font-medium">พื้นที่</p>
                    <div className="flex flex-wrap gap-2">
                      {providerAreas.map((code) => (
                        <Chip
                          key={code}
                          active={area === code}
                          onClick={() => {
                            setChosenArea(code);
                            clearError("area");
                          }}
                        >
                          {AREAS[code]}
                        </Chip>
                      ))}
                    </div>
                    <FieldHint id="area-hint" error={errors.area}>
                      เลือกพื้นที่ที่ร้านให้บริการ
                    </FieldHint>
                  </div>
                )}
              </div>

              <div
                tabIndex={-1}
                aria-invalid={Boolean(errors.place)}
                aria-describedby="place-hint"
                className="mt-6 outline-none"
              >
                <p className="mb-2 text-base font-medium">ประเภทสถานที่</p>
                <div className="grid grid-cols-2 gap-3">
                  {PLACE_TYPE_CODES.map((code) => (
                    <ChoiceCard
                      key={code}
                      selected={place === code}
                      onSelect={() => {
                        setPlace(code);
                        clearError("place");
                      }}
                      title={PLACE_TYPES[code]}
                      className="min-h-14 px-3"
                    />
                  ))}
                </div>
                <FieldHint id="place-hint" error={errors.place} />
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Label htmlFor="note" className="text-base">
                  หมายเหตุถึงร้าน (ไม่บังคับ)
                </Label>
                <Textarea
                  id="note"
                  maxLength={1000}
                  placeholder="เช่น จุดสังเกตหน้าบ้าน หรือเวลาที่สะดวกเป็นพิเศษ"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </section>
          </form>
        </Rise>
      </TwoColumn>
    </AppShell>
  );
}

function SummaryLine({
  label,
  value,
  flashOnMount = false,
}: {
  label: string;
  value: string;
  flashOnMount?: boolean;
}) {
  return (
    <FlashOnChange onMount={flashOnMount} className="-mx-2 flex items-start justify-between gap-4 px-2 py-0.5">
      <dt className="min-w-0 text-muted-foreground">{label}</dt>
      <dd className="numeric shrink-0 font-medium">{value}</dd>
    </FlashOnChange>
  );
}
