"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/app-shell";
import { Chip } from "@/components/chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Monogram } from "@/components/visuals";
import { formatShortDateTime } from "../display";
import type { MessageDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { sendOrderMessage } from "@/server/actions/extras";

/**
 * ข้อความระหว่างลูกค้ากับร้านในคำสั่งเดียวกัน ใช้ร่วมกันทั้งหน้าลูกค้าและหน้าร้าน
 * counterpartLabel คือชื่อฝั่งตรงข้ามที่แสดงในหัวข้อ เช่น "ร้าน" หรือ "ลูกค้า"
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
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  // เลื่อนไปข้อความล่าสุดเมื่อเปิดหน้าและเมื่อมีข้อความใหม่
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await sendOrderMessage({ orderId, body: text });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBody("");
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
          <form onSubmit={send} className="flex flex-col gap-3">
            {quickReplies && quickReplies.length > 0 ? (
              <div
                role="group"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0"
                aria-label="ข้อความสำเร็จรูป"
              >
                {quickReplies.map((text) => (
                  <Chip key={text} onClick={() => setBody(text)}>
                    {text}
                  </Chip>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <Textarea
                rows={2}
                placeholder="พิมพ์ข้อความ"
                aria-label="ข้อความ"
                maxLength={1000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-14 flex-1 rounded-lg text-base"
              />
              <Button
                type="submit"
                size="icon-xl"
                aria-label={pending ? "กำลังส่ง" : "ส่งข้อความ"}
                className="mb-1 shrink-0"
                disabled={pending}
              >
                <Send />
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
