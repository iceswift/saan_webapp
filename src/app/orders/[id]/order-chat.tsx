"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/app-shell";
import { Chip } from "@/components/chip";
import { FieldHint } from "@/components/field-hint";
import { PhotoThumbs } from "@/components/lightbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Monogram } from "@/components/visuals";
import { formatShortDateTime } from "../display";
import type { MessageDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { sendOrderMessage } from "@/server/actions/extras";

const MAX_BYTES = 5 * 1024 * 1024;

/** อัปโหลดรูปไป /api/upload (jpg/png/webp ไม่เกิน 5 MB ตามที่ API ตรวจ) คืน URL หรือ null เมื่อไม่สำเร็จ */
async function uploadPhoto(file: File): Promise<string | null> {
  if (file.size > MAX_BYTES) {
    toast.error("รูปต้องมีขนาดไม่เกิน 5 MB");
    return null;
  }
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = (await res.json()) as { url?: string; error?: string };
    if (res.ok && json.url) return json.url;
    toast.error(json.error ?? "อัปโหลดรูปไม่สำเร็จ");
  } catch {
    toast.error("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
  }
  return null;
}

/**
 * ข้อความระหว่างลูกค้ากับร้านในคำสั่งเดียวกัน ใช้ร่วมกันทั้งหน้าลูกค้าและหน้าร้าน
 * counterpartLabel คือชื่อฝั่งตรงข้ามที่แสดงในหัวข้อ เช่น "ร้าน" หรือ "ลูกค้า"
 * แนบรูปได้ 1 รูปต่อข้อความ (ปุ่มรูปภาพ) ส่งรูปอย่างเดียวได้ รูปในข้อความแตะเพื่อขยาย
 * quickReplies (ไม่บังคับ) คือข้อความสั้น ๆ ที่แตะเพื่อเติมลงช่องพิมพ์ ช่วยผู้ที่พิมพ์ลำบาก
 */
export function OrderChat({
  orderId,
  messages,
  disabled,
  counterpartLabel,
  quickReplies,
  titleClassName,
}: {
  orderId: string;
  messages: MessageDTO[];
  disabled: boolean;
  counterpartLabel: string;
  quickReplies?: string[];
  /** ปรับระยะของหัวข้อ เช่น "lg:mt-0" เมื่อเป็นส่วนแรกของคอลัมน์บนเดสก์ท็อป */
  titleClassName?: string;
}) {
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();

  // เลื่อนไปข้อความล่าสุดเมื่อเปิดหน้าและเมื่อมีข้อความใหม่
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function pickFile(files: FileList | null) {
    const file = files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setUploading(true);
    const url = await uploadPhoto(file);
    setUploading(false);
    if (url) {
      setPhoto(url);
      setError(null);
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (uploading) return;
    if (!text && !photo) {
      setError("พิมพ์ข้อความหรือแนบรูปก่อนส่ง");
      requestAnimationFrame(() => textRef.current?.focus());
      return;
    }
    startTransition(async () => {
      const res = await sendOrderMessage({ orderId, body: text, ...(photo ? { photoUrl: photo } : {}) });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setPhoto(null);
      setError(null);
    });
  }

  return (
    <section>
      <SectionTitle className={titleClassName}>ข้อความถึง{counterpartLabel}</SectionTitle>
      <div className="flex flex-col gap-4">
        {messages.length === 0 ? (
          <p className="border-y border-border py-4 text-base text-muted-foreground">
            ยังไม่มีข้อความ เริ่มทักทายได้เลย
          </p>
        ) : (
          <ul
            ref={listRef}
            className="-mx-1 flex max-h-96 flex-col gap-4 overflow-y-auto px-1 py-1 lg:max-h-[28rem]"
            aria-label={`ข้อความถึง${counterpartLabel}`}
          >
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn("flex items-end gap-2", message.mine ? "flex-row-reverse" : "flex-row")}
              >
                {message.mine ? null : <Monogram name={message.senderName} size="sm" className="mb-6" />}
                <div className={cn("flex min-w-0 max-w-[82%] flex-col gap-1", message.mine ? "items-end" : "items-start")}>
                  {message.mine ? null : (
                    <span className="px-1 text-sm text-muted-foreground">{message.senderName}</span>
                  )}
                  {message.photoUrl ? (
                    <PhotoThumbs urls={[message.photoUrl]} alt="รูปที่แนบในข้อความ" variant="message" />
                  ) : null}
                  {message.body ? (
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-base break-words whitespace-pre-wrap",
                        message.mine
                          ? "rounded-br-lg bg-primary text-primary-foreground"
                          : "rounded-bl-lg bg-muted",
                      )}
                    >
                      {message.body}
                    </div>
                  ) : null}
                  <time dateTime={message.createdAt} className="px-1 text-sm text-muted-foreground">
                    {formatShortDateTime(message.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}

        {disabled ? (
          <p className="border-y border-border py-3 text-base text-muted-foreground">
            คำสั่งนี้ถูกยกเลิกแล้ว ส่งข้อความไม่ได้
          </p>
        ) : (
          <form onSubmit={send} noValidate className="flex flex-col gap-3">
            {quickReplies && quickReplies.length > 0 ? (
              <div
                role="group"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0"
                aria-label="ข้อความสำเร็จรูป"
              >
                {quickReplies.map((text) => (
                  <Chip
                    key={text}
                    onClick={() => {
                      setBody(text);
                      setError(null);
                    }}
                  >
                    {text}
                  </Chip>
                ))}
              </div>
            ) : null}
            {photo || uploading ? (
              <div className="flex items-center gap-3">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="รูปที่จะส่ง" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {photo ? "แนบรูปแล้ว" : "กำลังอัปโหลดรูป"}
                </span>
                {photo ? (
                  <button
                    type="button"
                    aria-label="เอารูปออก"
                    onClick={() => setPhoto(null)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-foreground/20 transition-colors hover:bg-muted"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                aria-label="เลือกรูปที่จะแนบ"
                onChange={(e) => void pickFile(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-xl"
                aria-label="แนบรูป"
                className="mb-1 shrink-0"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus />
              </Button>
              <Textarea
                ref={textRef}
                rows={2}
                placeholder="พิมพ์ข้อความ"
                aria-label="ข้อความ"
                maxLength={1000}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={hintId}
                className="min-h-14 flex-1 rounded-lg text-base"
              />
              <Button
                type="submit"
                size="icon-xl"
                aria-label={pending ? "กำลังส่ง" : "ส่งข้อความ"}
                className="mb-1 shrink-0"
                loading={pending}
              >
                <Send />
              </Button>
            </div>
            <FieldHint id={hintId} error={error} />
          </form>
        )}
      </div>
    </section>
  );
}
