"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Chip } from "@/components/chip";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ListGroup } from "@/components/list-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AREAS, type AreaCode } from "@/lib/constants";
import type { AddressDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { saveAddress } from "@/server/actions/settings";
import { AccountNav } from "../account-nav";
import { ToggleRow } from "../toggle-row";
import { DeleteAddressButton } from "./address-actions";

const QUICK_LABELS = ["บ้าน", "ร้าน", "ที่ทำงาน"];
const FORM_ID = "address-form";

/** ฟอร์มเพิ่มและแก้ไขที่อยู่ ใช้ร่วมกันทั้งสองหน้า ช่องวางบนหน้าตรง ๆ */
export function AddressForm({ initial }: { initial?: AddressDTO }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [area, setArea] = useState<AreaCode | "">(initial?.area ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [errors, setErrors] = useState<{ label?: string; area?: string; address?: string }>({});

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!label.trim()) next.label = "กรุณาตั้งชื่อที่อยู่";
    if (!area) next.area = "กรุณาเลือกพื้นที่";
    if (address.trim().length < 5) next.address = "กรุณากรอกที่อยู่ให้ครบ";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await saveAddress({ id: initial?.id, label, area: area as AreaCode, address, isDefault });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push("/settings/addresses");
    });
  }

  return (
    <AppShell
      side={<AccountNav />}
      footer={
        <Button type="submit" form={FORM_ID} size="xl" className="w-full" loading={pending}>
          บันทึก
        </Button>
      }
    >
      <PageHeader title={initial ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่"} backHref="/settings/addresses" />

      <form id={FORM_ID} ref={formRef} onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-7">
        <div>
          <Label htmlFor="label" className="mb-2 text-base">
            ชื่อที่อยู่
          </Label>
          <Input
            id="label"
            maxLength={40}
            placeholder="เช่น บ้าน ร้าน บ้านแม่"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setErrors((p) => ({ ...p, label: undefined }));
            }}
            aria-invalid={Boolean(errors.label)}
            aria-describedby="label-hint"
          />
          <FieldHint id="label-hint" error={errors.label} />
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="เลือกเร็ว">
            {QUICK_LABELS.map((quick) => (
              <Chip
                key={quick}
                active={label === quick}
                onClick={() => {
                  setLabel(quick);
                  setErrors((p) => ({ ...p, label: undefined }));
                }}
              >
                {quick}
              </Chip>
            ))}
          </div>
        </div>

        <fieldset aria-describedby="area-hint">
          <legend className="mb-3 text-base font-medium">พื้นที่</legend>
          <div
            id="area"
            tabIndex={-1}
            aria-invalid={Boolean(errors.area)}
            className="flex flex-col gap-3 lg:grid lg:grid-cols-2"
          >
            {(Object.keys(AREAS) as AreaCode[]).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={area === code}
                onClick={() => {
                  setArea(code);
                  setErrors((p) => ({ ...p, area: undefined }));
                }}
                className={cn(
                  "surface flex min-h-14 w-full items-center px-5 text-left text-base font-medium transition-colors",
                  area === code ? "border-primary" : "hover:bg-muted",
                )}
              >
                {AREAS[code]}
              </button>
            ))}
          </div>
          <FieldHint id="area-hint" error={errors.area} />
        </fieldset>

        <div>
          <Label htmlFor="address" className="mb-2 text-base">
            ที่อยู่
          </Label>
          <Textarea
            id="address"
            maxLength={500}
            placeholder="บ้านเลขที่ ซอย ถนน ตำบลหรือแขวง อำเภอหรือเขต"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setErrors((p) => ({ ...p, address: undefined }));
            }}
            aria-invalid={Boolean(errors.address)}
            aria-describedby="address-hint"
            className="text-base"
          />
          <FieldHint id="address-hint" error={errors.address} />
        </div>

        <ListGroup>
          <ToggleRow
            title="ตั้งเป็นที่อยู่หลัก"
            description="ใช้เป็นค่าเริ่มต้นเมื่อสั่งซื้อในพื้นที่เดียวกัน"
            checked={isDefault}
            disabled={initial?.isDefault === true}
            onToggle={() => setIsDefault((v) => !v)}
          />
        </ListGroup>
      </form>

      {initial ? (
        <div className="mt-8 max-w-xl border-t border-border pt-6">
          <DeleteAddressButton address={initial} />
        </div>
      ) : null}
    </AppShell>
  );
}
