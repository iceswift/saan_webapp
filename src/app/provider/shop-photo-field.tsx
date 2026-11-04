"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FieldHint } from "@/components/field-hint";
import { Button } from "@/components/ui/button";

/** Single public photo, with upload state shared with the enclosing save action. */
export function ShopPhotoField({ value, onChange, onBusyChange, saving }: {
  value: string | null;
  onChange: (value: string | null) => void;
  onBusyChange: (busy: boolean) => void;
  saving: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function upload(file: File | undefined) {
    if (!file || busy || saving) return;
    setError(undefined);
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError("เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");
      if (input.current) input.current.value = "";
      return;
    }
    setBusy(true);
    onBusyChange(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const result: { url?: string; error?: string } = await response.json();
      if (!response.ok || !result.url || !/^\/api\/files\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(result.url)) {
        setError(result.error || "อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      onChange(result.url);
    } catch {
      setError("อัปโหลดไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง รูปเดิมยังอยู่");
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (input.current) input.current.value = "";
    }
  }
  return <div className="flex flex-col gap-3" aria-busy={busy}>
    {value ? <div className="relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted"><Image src={value} alt="ตัวอย่างรูปที่จะแสดงบนหน้าร้าน" fill sizes="(min-width: 768px) 448px, 90vw" className="object-cover" /></div> : null}
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="ไฟล์รูปหน้าร้าน" onChange={event => void upload(event.target.files?.[0])} />
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" size="xl" loading={busy} disabled={saving} aria-describedby="shop-photo-hint" onClick={() => input.current?.click()}>{busy ? "กำลังอัปโหลดรูป" : value ? "เปลี่ยนรูปหน้าร้าน" : "เพิ่มรูปหน้าร้าน"}</Button>
      {value ? <Button type="button" variant="ghost" size="xl" disabled={busy || saving} onClick={() => { onChange(null); setError(undefined); }}>นำรูปออกจากหน้าร้าน</Button> : null}
    </div>
    <FieldHint id="shop-photo-hint" error={error}>JPG, PNG หรือ WebP ไม่เกิน 5 MB รูปจะเปลี่ยนบนหน้าร้านเมื่อกดบันทึก</FieldHint>
    <p role="status" className="text-sm text-muted-foreground">{busy ? "กำลังอัปโหลด โปรดรอก่อนบันทึกข้อมูลร้าน" : ""}</p>
  </div>;
}
