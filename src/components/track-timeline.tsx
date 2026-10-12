"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrackEvent = {
  id: string;
  title: string;
  note?: string;
  photoUrl?: string | null;
  /** ผู้ทำ เช่น "ร้าน" "คุณ" */
  actor: string;
  /** เวลาแบบอ่านได้ (จัดรูปแบบจากฝั่งเซิร์ฟเวอร์) */
  time: string;
};

export type TrackStep = { title: string; note?: string };

/**
 * เส้นเวลาติดตามงาน (v6.2): เส้นแกนตั้ง จุดที่เกิดแล้วเป็นหมึกทึบ จุด "ตอนนี้" เป็นวงชาดที่เต้นช้า ๆ
 * ขั้นที่ยังไม่ถึงเป็นวงโปร่งเส้นประ (ข้อความจางเพราะยังไม่เกิดขึ้น ไม่ใช่เพราะอ่านไม่ได้)
 * - events: เหตุการณ์จริงเรียงเก่า -> ใหม่
 * - upcoming: ขั้นที่ยังไม่เกิด ตัวแรกคือขั้นปัจจุบัน (ต้องตรงกับช่องที่เติมอยู่ใน StatusLine)
 * - closed: "cancelled" = จุดสุดท้ายเป็นเครื่องหมายปิดงาน (ไม่มีขั้นต่อไป)
 * - เหตุการณ์ใหม่ที่เข้ามาหลังหน้ารีเฟรช (หลังการกระทำของร้านหรือลูกค้า) จะลอยขึ้นมา ส่วนที่เห็นอยู่แล้วไม่ขยับ
 * - วงเต้นเป็นลูปที่อนุญาต (AGENTS v6.2): หยุดเมื่อพ้นจอและเมื่อปิดการเคลื่อนไหว
 */
export function TrackTimeline({
  events,
  upcoming,
  closed = null,
  label = "ความคืบหน้า",
}: {
  events: TrackEvent[];
  upcoming: TrackStep[];
  closed?: "cancelled" | null;
  label?: string;
}) {
  // เหตุการณ์ที่เรนเดอร์ครั้งแรก = ไม่ต้องลอยเข้า; ที่โผล่มาทีหลัง = ลอยเข้า
  const [known] = useState(() => new Set(events.map((e) => e.id)));
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      el.dataset.paused = entry.isIntersecting ? "false" : "true";
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  type Node =
    | { key: string; kind: "done" | "stop"; event: TrackEvent }
    | { key: string; kind: "now" | "next"; step: TrackStep };
  const nodes: Node[] = [
    ...events.map((event, i): Node => ({
      key: event.id,
      kind: closed === "cancelled" && i === events.length - 1 ? "stop" : "done",
      event,
    })),
    ...upcoming.map((step, i): Node => ({ key: `up-${i}-${step.title}`, kind: i === 0 ? "now" : "next", step })),
  ];

  return (
    <ol ref={listRef} aria-label={label} data-paused="false">
      {nodes.map((node, index) => {
        const last = index === nodes.length - 1;
        const nextNode = nodes[index + 1];
        const toFuture = nextNode && (nextNode.kind === "now" || nextNode.kind === "next");
        const isNew = node.kind === "done" || node.kind === "stop" ? !known.has(node.key) : false;
        return (
          <li
            key={node.key}
            aria-current={node.kind === "now" ? "step" : undefined}
            className={cn("relative flex gap-4", !last && "pb-6", isNew && "rise")}
          >
            {last ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 bottom-0 left-[0.6875rem] border-l-2 transition-colors duration-300",
                  node.kind === "next"
                    ? "border-dashed border-input"
                    : toFuture
                      ? "border-dashed border-foreground/40"
                      : "border-solid border-foreground",
                )}
              />
            )}
            <Dot kind={node.kind} />
            <div className="min-w-0 flex-1">
              {"event" in node ? (
                <>
                  <p className="text-base leading-snug font-medium">{node.event.title}</p>
                  {node.event.note ? (
                    <p className="mt-0.5 text-base leading-relaxed whitespace-pre-line text-muted-foreground">
                      {node.event.note}
                    </p>
                  ) : null}
                  <p className="numeric mt-0.5 text-sm text-muted-foreground">
                    {node.event.actor} · {node.event.time}
                  </p>
                  {node.event.photoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={node.event.photoUrl}
                        alt={node.event.title}
                        loading="lazy"
                        className="mt-3 max-h-64 w-full rounded-lg object-cover ring-1 ring-foreground/6 ring-inset sm:max-w-sm"
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <p
                    className={cn(
                      "text-base leading-snug",
                      node.kind === "now" ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {node.kind === "now" ? <span className="sr-only">ขั้นตอนตอนนี้: </span> : null}
                    {node.step.title}
                  </p>
                  {node.step.note ? (
                    <p className="numeric mt-0.5 text-sm text-muted-foreground">{node.step.note}</p>
                  ) : null}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Dot({ kind }: { kind: "done" | "stop" | "now" | "next" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
        kind === "done" && "bg-foreground text-background",
        kind === "stop" && "bg-destructive text-destructive-foreground",
        kind === "now" && "track-now border-2 border-gold bg-background",
        kind === "next" && "border-2 border-dashed border-input bg-background",
      )}
    >
      {kind === "done" ? <Check className="size-3.5" strokeWidth={3} /> : null}
      {kind === "stop" ? <X className="size-3.5" strokeWidth={3} /> : null}
      {kind === "now" ? <span className="size-2.5 rounded-full bg-gold" /> : null}
    </span>
  );
}
