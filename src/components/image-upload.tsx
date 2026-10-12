"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

/**
 * ช่องแนบรูป อัปโหลดไปที่ /api/upload แล้วคืนรายการ URL ผ่าน onChange
 * ใช้แบบ controlled: <ImageUpload value={urls} onChange={setUrls} max={6} />
 * ถ้าต้องการรูปเดียวให้ใส่ max={1} แล้วอ่าน urls[0]
 */
export function ImageUpload({
  value,
  onChange,
  max = 6,
  label = "เพิ่มรูป",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = max - value.length;
    const picked = Array.from(files).slice(0, room);
    setUploading(true);
    const added: string[] = [];
    for (const file of picked) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = (await res.json()) as { url?: string; error?: string };
        if (res.ok && json.url) added.push(json.url);
        else toast.error(json.error ?? "อัปโหลดรูปไม่สำเร็จ");
      } catch {
        toast.error("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
      }
    }
    setUploading(false);
    if (added.length > 0) onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {value.map((url) => (
        <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="รูปที่แนบ" className="size-full object-cover" />
          <button
            type="button"
            aria-label="ลบรูปนี้"
            onClick={() => onChange(value.filter((u) => u !== url))}
            className="absolute top-1.5 right-1.5 flex size-9 items-center justify-center rounded-full bg-foreground/80 text-background transition-transform active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {value.length < max ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-background text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          {uploading ? "กำลังอัปโหลด" : label}
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
