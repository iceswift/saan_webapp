"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import {
  THAI_MONTHS,
  THAI_WEEKDAYS_SHORT,
  addDays,
  addMonths,
  compareYMD,
  daysInMonth,
  formatThaiLong,
  formatThaiShort,
  parseYMD,
  toYMDString,
  weekdayOf,
  type YMD,
} from "@/components/thai-date";
import { cn } from "@/lib/utils";
import { setDateBlocked } from "@/server/actions/provider";

/**
 * ปฏิทินวันรับงานของร้าน (เดือนละหน้า พ.ศ.): แตะวันเพื่อปิดหรือเปิดรับงานวันนั้น
 * - blocked: วันที่ปิดรับงาน (จากเซิร์ฟเวอร์) ปรับบนจอทันทีแล้วค่อยบันทึก ถ้าบันทึกไม่สำเร็จจะย้อนกลับและแจ้ง
 * - jobs: จำนวนงานที่ยืนยันแล้วต่อวัน (yyyy-mm-dd ตามเวลาไทย) | today: วันนี้ตามเวลาไทยจากเซิร์ฟเวอร์ (กัน hydration ไม่ตรง)
 * - ปิดรับงานแล้วไม่ยกเลิกงานที่ยืนยันไว้ แค่ไม่ให้ลูกค้าเลือกวันนั้นตอนสั่งใหม่
 * - แป้นพิมพ์: ลูกศร = ขยับวัน, Home/End = ต้น/ท้ายสัปดาห์, PageUp/PageDown = เปลี่ยนเดือน, Enter/Space = ปิด/เปิด
 */
export function AvailabilityCalendar({
  blocked: initialBlocked,
  jobs,
  today,
  maxDate,
}: {
  blocked: string[];
  jobs: Record<string, number>;
  today: string;
  /** วันสุดท้ายที่ตั้งได้ (ล่วงหน้าไม่เกิน 1 ปี) */
  maxDate: string;
}) {
  const todayYMD = parseYMD(today)!;
  const maxYMD = parseYMD(maxDate)!;
  const [blocked, setBlocked] = useState<string[]>(initialBlocked);
  const [busy, setBusy] = useState<string | null>(null);
  const [focus, setFocus] = useState<YMD>(todayYMD);
  const gridRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-ymd="${toYMDString(focus)}"]`)?.focus();
  }, [focus]);

  const blockedSet = new Set(blocked);

  async function toggle(ymd: string, label: string, closing: boolean) {
    if (busy) return;
    setBusy(ymd);
    setBlocked((cur) => (closing ? [...new Set([...cur, ymd])].sort() : cur.filter((d) => d !== ymd)));
    const res = await setDateBlocked({ date: ymd, blocked: closing });
    setBusy(null);
    if (!res.ok) {
      setBlocked((cur) => (closing ? cur.filter((d) => d !== ymd) : [...new Set([...cur, ymd])].sort()));
      toast.error(res.error);
      return;
    }
    if (closing) {
      toast.success(`ปิดรับงานวันที่ ${label} แล้ว`, {
        description: "งานที่ยืนยันไว้แล้วยังอยู่ตามเดิม",
        action: { label: "ย้อนกลับ", onClick: () => void toggle(ymd, label, false) },
      });
    } else {
      toast.success(`เปิดรับงานวันที่ ${label} แล้ว`);
    }
  }

  const lead = weekdayOf({ ...focus, d: 1 });
  const total = daysInMonth(focus.y, focus.m);
  const cells: (YMD | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => ({ y: focus.y, m: focus.m, d: i + 1 })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const prevMonth = addMonths({ ...focus, d: 1 }, -1);
  const nextMonth = addMonths({ ...focus, d: 1 }, 1);
  const canPrev = compareYMD({ ...prevMonth, d: daysInMonth(prevMonth.y, prevMonth.m) }, todayYMD) >= 0;
  const canNext = compareYMD(nextMonth, maxYMD) <= 0;

  function moveTo(next: YMD) {
    const clamped = compareYMD(next, todayYMD) < 0 ? todayYMD : compareYMD(next, maxYMD) > 0 ? maxYMD : next;
    wantFocus.current = true;
    setFocus(clamped);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step: Record<string, YMD | undefined> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      Home: addDays(focus, -weekdayOf(focus)),
      End: addDays(focus, 6 - weekdayOf(focus)),
      PageUp: addMonths(focus, -1),
      PageDown: addMonths(focus, 1),
    };
    const next = step[e.key];
    if (!next) return;
    e.preventDefault();
    moveTo(next);
  }

  const upcoming = [...blocked].sort();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="เดือนก่อนหน้า"
            disabled={!canPrev}
            onClick={() => setFocus(compareYMD(prevMonth, todayYMD) < 0 ? todayYMD : prevMonth)}
            className="flex size-11 items-center justify-center rounded-full border border-foreground/20 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <p aria-live="polite" className="numeric font-display text-lg font-medium">
            {THAI_MONTHS[focus.m]} {focus.y + 543}
          </p>
          <button
            type="button"
            aria-label="เดือนถัดไป"
            disabled={!canNext}
            onClick={() => setFocus(nextMonth)}
            className="flex size-11 items-center justify-center rounded-full border border-foreground/20 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={gridRef}
          role="grid"
          aria-label={`ปฏิทินรับงาน ${THAI_MONTHS[focus.m]} ${focus.y + 543}`}
          onKeyDown={onKeyDown}
          className="max-w-md"
        >
          <div role="row" className="grid grid-cols-7">
            {THAI_WEEKDAYS_SHORT.map((w) => (
              <span
                key={w}
                role="columnheader"
                className="flex h-9 items-center justify-center text-sm text-muted-foreground"
              >
                {w}
              </span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} role="row" className="grid grid-cols-7">
              {week.map((day, di) => {
                if (!day) return <span key={di} role="gridcell" aria-hidden="true" />;
                const ymd = toYMDString(day);
                const past = compareYMD(day, todayYMD) < 0;
                const far = compareYMD(day, maxYMD) > 0;
                const closed = blockedSet.has(ymd);
                const count = jobs[ymd] ?? 0;
                const isToday = compareYMD(day, todayYMD) === 0;
                const isFocus = compareYMD(day, focus) === 0;
                const label = formatThaiShort(day);
                return (
                  <span key={di} role="gridcell" className="flex justify-center py-0.5">
                    <button
                      type="button"
                      data-ymd={ymd}
                      tabIndex={isFocus ? 0 : -1}
                      disabled={past || far}
                      aria-pressed={closed}
                      aria-label={
                        formatThaiLong(day) +
                        (isToday ? " (วันนี้)" : "") +
                        (closed ? " ปิดรับงาน" : " เปิดรับงาน") +
                        (count > 0 ? ` มีงานที่ยืนยันแล้ว ${count} งาน` : "")
                      }
                      onClick={() => {
                        setFocus(day);
                        void toggle(ymd, label, !closed);
                      }}
                      className={cn(
                        "cal-day numeric relative flex h-12 w-11 flex-col items-center justify-center rounded-full text-base transition-colors",
                        closed
                          ? "border border-dashed border-foreground/40 bg-muted text-muted-foreground line-through decoration-1"
                          : "hover:bg-muted",
                        isToday && !closed && "border border-gold font-medium",
                        (past || far) && "pointer-events-none opacity-35",
                        busy === ymd && "opacity-60",
                      )}
                    >
                      <span>{day.d}</span>
                      {count > 0 ? (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0.5 flex items-center gap-0.5 text-sm leading-none text-foreground"
                        >
                          <span className="size-1.5 rounded-full bg-gold" />
                          {count > 1 ? count : null}
                        </span>
                      ) : null}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground" aria-label="คำอธิบายสัญลักษณ์">
          <li className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-foreground/40 bg-muted text-sm leading-none line-through">
              5
            </span>
            ปิดรับงาน
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
            มีงานที่ยืนยันแล้ว
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-5 rounded-full border border-gold" />
            วันนี้
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          แตะวันที่เพื่อปิดหรือเปิดรับงาน ลูกค้าจะเลือกวันที่ปิดรับตอนสั่งใหม่ไม่ได้ งานที่ยืนยันแล้วไม่เปลี่ยนตาม
        </p>
      </div>

      <section aria-labelledby="blocked-heading">
        <h2 id="blocked-heading" className="mb-3 text-base font-medium">
          วันที่ปิดรับงาน
        </h2>
        {upcoming.length === 0 ? (
          <p className="flex items-center gap-3 border-y border-border py-4 text-base text-muted-foreground">
            <CalendarX2 className="size-5 shrink-0" aria-hidden="true" />
            ยังไม่มีวันที่ปิดรับงาน
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {upcoming.map((ymd) => {
              const day = parseYMD(ymd)!;
              const label = formatThaiShort(day);
              return (
                <li key={ymd} className="flex min-h-14 items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="numeric block text-base font-medium">{label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {formatThaiLong(day).split("ที่")[0]}
                      {jobs[ymd] ? ` · มีงานที่ยืนยันแล้ว ${jobs[ymd]} งาน` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={busy === ymd}
                    aria-label={`เปิดรับงานวันที่ ${label}`}
                    onClick={() => void toggle(ymd, label, false)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-foreground/20 px-4 text-base font-medium transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    <X className="size-4" aria-hidden="true" />
                    เปิดรับ
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
