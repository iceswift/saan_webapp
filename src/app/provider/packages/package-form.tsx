"use client";

import { parseWholeBaht } from "@/lib/baht-input";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { Price } from "@/components/price";
import { Rise } from "@/components/rise";
import { TonePill } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThumbArt } from "@/components/visuals";
import { PACKAGE_TYPES, type PackageType } from "@/lib/constants";
import type { PackageDTO } from "@/lib/types";
import { savePackage } from "@/server/actions/provider";
import { Field, FormSection, PriceField, priceError } from "../form-bits";
import { ProviderNav } from "../provider-nav";
import { Split } from "../split";
import { PACKAGE_TYPE_ART } from "../icon-map";
import { buildOptions, OptionCards } from "../pickers";
import { StatusSwitch } from "../status-switch";

const TYPE_OPTIONS = buildOptions(PACKAGE_TYPES, {
  thumb: (type) => <ThumbArt service={PACKAGE_TYPE_ART[type]} size="md" />,
});

type Errors = { type?: string; name?: string; price?: string };

/** หน้าเพิ่มหรือแก้ไขบริการเสริม ใช้ร่วมกันระหว่างหน้าเพิ่มและหน้าแก้ไข มีตัวอย่างสิ่งที่ลูกค้าเห็นข้างฟอร์ม */
export function PackageForm({
  pkg,
  title,
  navBadges,
}: {
  pkg: PackageDTO | null;
  title: string;
  /** ตัวเลขบนเมนูด้านข้างของร้าน (เดสก์ท็อป) */
  navBadges?: { orders: number; requests: number };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<PackageType | null>(pkg?.type ?? null);
  const [name, setName] = useState(pkg?.name ?? "");
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [price, setPrice] = useState(pkg ? String(pkg.price) : "");
  const [open, setOpen] = useState(pkg ? pkg.active : true);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmedName = name.trim();
    const next: Errors = {};
    if (!type) next.type = "เลือกประเภทบริการ";
    if (trimmedName.length < 2) next.name = "กรอกชื่อบริการ";
    const priceProblem = priceError(price);
    if (priceProblem) next.price = priceProblem;
    setErrors(next);
    if (Object.keys(next).length > 0 || !type) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    startTransition(async () => {
      const res = await savePackage({
        id: pkg?.id,
        type,
        name: trimmedName,
        description: description.trim(),
        price: parseWholeBaht(price) ?? 0,
        active: open,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push("/provider?tab=catalog");
    });
  }

  const previewPrice = parseWholeBaht(price) ?? 0;
  const previewValid = Number.isInteger(previewPrice) && previewPrice >= 1;

  return (
    <AppShell
      width="full"
      side={<ProviderNav current="catalog" badges={navBadges} />}
      desktopFooter="hide"
      footer={
        <Button type="submit" form="package-form" size="xl" variant="gold" loading={pending} className="w-full">
          บันทึก
        </Button>
      }
    >
      <PageHeader title={title} backHref="/provider?tab=catalog" backLabel="สินค้า" />

      <form
        id="package-form"
        ref={formRef}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Split
          className="xl:grid-cols-[minmax(0,42rem)_20rem]"
          aside={
            <section aria-label="ตัวอย่างที่ลูกค้าเห็น" className="md:max-w-sm xl:max-w-none">
              <p className="mb-2 text-sm text-muted-foreground">ตัวอย่างที่ลูกค้าเห็น</p>
              <div className="flex flex-col gap-4 surface p-4">
                <div className="flex items-start gap-4">
                  <ThumbArt service={type ? PACKAGE_TYPE_ART[type] : "offering"} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{type ? PACKAGE_TYPES[type] : "ยังไม่เลือกประเภท"}</p>
                    <p className="line-clamp-2 text-base leading-snug font-medium">
                      {name.trim() || "ชื่อบริการของคุณ"}
                    </p>
                  </div>
                </div>
                {description.trim() ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{description.trim()}</p>
                ) : null}
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  {previewValid ? (
                    <Price amount={previewPrice} />
                  ) : (
                    <span className="text-sm text-muted-foreground">ยังไม่ใส่ราคา</span>
                  )}
                  <TonePill tone={open ? "good" : "neutral"}>{open ? "เปิดขาย" : "ปิดขาย"}</TonePill>
                </div>
              </div>
              <Button
                type="submit"
                form="package-form"
                size="xl"
                variant="gold"
                loading={pending}
                className="mt-4 hidden w-full lg:inline-flex"
              >
                บันทึก
              </Button>
            </section>
          }
        >
          <div className="flex max-w-2xl flex-col gap-8">
            <Rise>
              <FormSection title="ประเภทบริการ">
                <fieldset>
                  <legend className="sr-only">ประเภทบริการ</legend>
                  <OptionCards
                    options={TYPE_OPTIONS}
                    value={type}
                    onChange={(v) => {
                      setType(v);
                      setErrors((s) => ({ ...s, type: undefined }));
                    }}
                    invalid={Boolean(errors.type)}
                    describedBy="package-type-hint"
                  />
                  <FieldHint id="package-type-hint" error={errors.type} />
                </fieldset>
              </FormSection>
            </Rise>

            <Rise i={1}>
              <FormSection title="ข้อมูลบริการ">
                <Field id="package-name" label="ชื่อบริการ" error={errors.name}>
                  <Input
                    id="package-name"
                    placeholder="เช่น พิธีตั้งศาลพร้อมพราหมณ์"
                    maxLength={120}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((s) => ({ ...s, name: undefined }));
                    }}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby="package-name-hint"
                  />
                </Field>
                <Field
                  id="package-description"
                  label="รายละเอียดที่รวมในราคา"
                  hint="เช่น ค่าแรง เครื่องสังเวย และการเดินทาง (ไม่บังคับ)"
                >
                  <Textarea
                    id="package-description"
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
              </FormSection>
            </Rise>

            <Rise i={2}>
              <FormSection title="ราคาและการขาย">
                <PriceField
                  id="package-price"
                  value={price}
                  onChange={(v) => {
                    setPrice(v);
                    setErrors((s) => ({ ...s, price: undefined }));
                  }}
                  placeholder="เช่น 2500"
                  error={errors.price}
                />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium">เปิดขาย</p>
                    <p className="text-sm text-muted-foreground">
                      {open ? "ลูกค้าเห็นและสั่งได้" : "ลูกค้าจะไม่เห็นรายการนี้"}
                    </p>
                  </div>
                  <StatusSwitch checked={open} onChange={setOpen} label="เปิดขายบริการนี้" />
                </div>
              </FormSection>
            </Rise>
          </div>
        </Split>
      </form>
    </AppShell>
  );
}
