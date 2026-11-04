"use client";

import { parseWholeBaht } from "@/lib/baht-input";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ImageUpload } from "@/components/image-upload";
import { Price } from "@/components/price";
import { Rise } from "@/components/rise";
import { TonePill } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShrineImage, ThumbArt } from "@/components/visuals";
import { SHRINE_KINDS, type ShrineKind } from "@/lib/constants";
import type { ProductDTO } from "@/lib/types";
import { saveProduct } from "@/server/actions/provider";
import { Field, FormSection, PriceField, priceError } from "../form-bits";
import { ProviderNav } from "../provider-nav";
import { Split } from "../split";
import { buildOptions, OptionCards } from "../pickers";
import { StatusSwitch } from "../status-switch";

const KIND_OPTIONS = buildOptions(SHRINE_KINDS, {
  thumb: (kind) => <ThumbArt kind={kind} size="md" />,
});

type Errors = { name?: string; kind?: string; price?: string };

/** หน้าเพิ่มหรือแก้ไขศาลที่ขาย ใช้ร่วมกันระหว่างหน้าเพิ่มและหน้าแก้ไข มีตัวอย่างสิ่งที่ลูกค้าเห็นข้างฟอร์ม */
export function ProductForm({
  product,
  title,
  navBadges,
}: {
  product: ProductDTO | null;
  title: string;
  /** ตัวเลขบนเมนูด้านข้างของร้าน (เดสก์ท็อป) */
  navBadges?: { orders: number; requests: number };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrl ? [product.imageUrl] : []);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [kind, setKind] = useState<ShrineKind | null>(product?.kind ?? null);
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [open, setOpen] = useState(product ? product.active : true);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmedName = name.trim();
    const next: Errors = {};
    if (trimmedName.length < 2) next.name = "กรอกชื่อศาล";
    if (!kind) next.kind = "เลือกประเภทศาล";
    const priceProblem = priceError(price);
    if (priceProblem) next.price = priceProblem;
    setErrors(next);
    if (Object.keys(next).length > 0 || !kind) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    startTransition(async () => {
      const res = await saveProduct({
        id: product?.id,
        name: trimmedName,
        description: description.trim(),
        kind,
        price: parseWholeBaht(price) ?? 0,
        imageUrl: imageUrls[0] ?? null,
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
        <Button type="submit" form="product-form" size="xl" variant="gold" loading={pending} className="w-full">
          บันทึก
        </Button>
      }
    >
      <PageHeader title={title} backHref="/provider?tab=catalog" backLabel="สินค้า" />

      <form
        id="product-form"
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
              <div className="overflow-hidden surface">
                <ShrineImage
                  src={imageUrls[0] ?? null}
                  alt={name || "ตัวอย่างศาล"}
                  kind={kind ?? undefined}
                  seed={product?.id ?? "preview"}
                  flush
                  className="aspect-4/3 w-full"
                />
                <div className="flex flex-col gap-0.5 p-3.5">
                  <p className="text-sm text-muted-foreground">{kind ? SHRINE_KINDS[kind] : "ยังไม่เลือกประเภท"}</p>
                  <p className="line-clamp-2 min-h-[3.2em] text-base leading-snug font-medium">
                    {name.trim() || "ชื่อศาลของคุณ"}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    {previewValid ? (
                      <Price amount={previewPrice} />
                    ) : (
                      <span className="text-sm text-muted-foreground">ยังไม่ใส่ราคา</span>
                    )}
                    <TonePill tone={open ? "good" : "neutral"}>{open ? "เปิดขาย" : "ปิดขาย"}</TonePill>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                form="product-form"
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
              <FormSection title="รูปศาล">
                <div className="max-w-sm">
                  <ImageUpload value={imageUrls} onChange={setImageUrls} max={1} label="เพิ่มรูปศาล" />
                </div>
              </FormSection>
            </Rise>

            <Rise i={1}>
              <FormSection title="ข้อมูลศาล">
                <Field id="product-name" label="ชื่อศาล" error={errors.name}>
                  <Input
                    id="product-name"
                    placeholder="เช่น ศาลพระภูมิไม้สัก 2 ชั้น"
                    maxLength={120}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((s) => ({ ...s, name: undefined }));
                    }}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby="product-name-hint"
                  />
                </Field>
                <Field id="product-description" label="รายละเอียด" hint="ขนาด วัสดุ และสิ่งที่รวมอยู่ในราคา (ไม่บังคับ)">
                  <Textarea
                    id="product-description"
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
                <fieldset>
                  <legend className="mb-2 text-base font-medium">ประเภทศาล</legend>
                  <OptionCards
                    options={KIND_OPTIONS}
                    value={kind}
                    onChange={(v) => {
                      setKind(v);
                      setErrors((s) => ({ ...s, kind: undefined }));
                    }}
                    invalid={Boolean(errors.kind)}
                    describedBy="product-kind-hint"
                  />
                  <FieldHint id="product-kind-hint" error={errors.kind} />
                </fieldset>
              </FormSection>
            </Rise>

            <Rise i={2}>
              <FormSection title="ราคาและการขาย">
                <PriceField
                  id="product-price"
                  value={price}
                  onChange={(v) => {
                    setPrice(v);
                    setErrors((s) => ({ ...s, price: undefined }));
                  }}
                  placeholder="เช่น 3500"
                  error={errors.price}
                />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium">เปิดขาย</p>
                    <p className="text-sm text-muted-foreground">
                      {open ? "ลูกค้าเห็นและสั่งได้" : "ลูกค้าจะไม่เห็นรายการนี้"}
                    </p>
                  </div>
                  <StatusSwitch checked={open} onChange={setOpen} label="เปิดขายศาลนี้" />
                </div>
              </FormSection>
            </Rise>
          </div>
        </Split>
      </form>
    </AppShell>
  );
}
