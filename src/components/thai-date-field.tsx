"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  todayYMD,
  toYMDString,
  weekdayOf,
  type YMD,
} from "./thai-date";

function clamp(value: YMD, min: YMD | null, max: YMD | null): YMD {
  if (min && compareYMD(value, min) < 0) return min;
  if (max && compareYMD(value, max) > 0) return max;
  return value;
}

/** ปฏิทินรายเดือน: เลื่อนด้วยลูกศร/ปุ่มเดือน, PageUp/PageDown เปลี่ยนเดือน (+Shift = ปี), Home/End ต้น/ท้ายสัปดาห์ */
function MonthGrid({
  selected,
  min,
  max,
  blocked,
  onPick,
}: {
  selected: YMD | null;
  min: YMD | null;
  max: YMD | null;
  blocked: Set<string>;
  onPick: (value: YMD) => void;
}) {
  const today = todayYMD();
  const isBlocked = (d: YMD) => blocked.has(toYMDString(d));
  /** ข้ามวันที่ปิดรับ: เดินต่อไปทางเดิมจนเจอวันที่เลือกได้ (ไม่เกิน 400 วัน) */
  const skipBlocked = (d: YMD, dir: 1 | -1): YMD => {
    let cur = d;
    for (let i = 0; i < 400 && isBlocked(cur); i++) cur = addDays(cur, dir);
    return cur;
  };
  const [focus, setFocus] = useState<YMD>(() =>
    clamp(skipBlocked(clamp(selected ?? today, min, max), 1), min, max),
  );
  const wantFocus = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-ymd="${toYMDString(focus)}"]`)
      ?.focus();
  }, [focus]);

  const move = (next: YMD, dir: 1 | -1 = 1) => {
    wantFocus.current = true;
    const free = skipBlocked(clamp(next, min, max), dir);
    const clamped = clamp(free, min, max);
    setFocus(isBlocked(clamped) ? focus : clamped);
  };

  const first = { y: focus.y, m: focus.m, d: 1 };
  const lead = weekdayOf(first);
  const total = daysInMonth(focus.y, focus.m);
  const cells: (YMD | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => ({ y: focus.y, m: focus.m, d: i + 1 })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const prevMonth = addMonths({ ...focus, d: 1 }, -1);
  const nextMonth = addMonths({ ...focus, d: 1 }, 1);
  const canPrev = !min || compareYMD({ ...prevMonth, d: daysInMonth(prevMonth.y, prevMonth.m) }, min) >= 0;
  const canNext = !max || compareYMD(nextMonth, max) <= 0;

  function onKeyDown(event: React.KeyboardEvent) {
    const step: Record<string, YMD | undefined> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      Home: addDays(focus, -weekdayOf(focus)),
      End: addDays(focus, 6 - weekdayOf(focus)),
      PageUp: addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: addMonths(focus, event.shiftKey ? 12 : 1),
    };
    const next = step[event.key];
    if (!next) return;
    event.preventDefault();
    move(next, compareYMD(next, focus) < 0 ? -1 : 1);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="เดือนก่อนหน้า"
          disabled={!canPrev}
          onClick={() => setFocus(clamp(prevMonth, min, max))}
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
          onClick={() => setFocus(clamp(nextMonth, min, max))}
          className="flex size-11 items-center justify-center rounded-full border border-foreground/20 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div ref={gridRef} role="grid" aria-label={`${THAI_MONTHS[focus.m]} ${focus.y + 543}`} onKeyDown={onKeyDown}>
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
              const outOfRange = Boolean((min && compareYMD(day, min) < 0) || (max && compareYMD(day, max) > 0));
              const closed = !outOfRange && isBlocked(day);
              const disabled = outOfRange;
              const isSelected = selected !== null && compareYMD(day, selected) === 0;
              const isToday = compareYMD(day, today) === 0;
              const isFocus = compareYMD(day, focus) === 0;
              return (
                <span key={di} role="gridcell" aria-selected={isSelected} className="flex justify-center">
                  <button
                    type="button"
                    data-ymd={toYMDString(day)}
                    tabIndex={isFocus ? 0 : -1}
                    disabled={disabled}
                    aria-disabled={closed ? true : undefined}
                    aria-label={
                      formatThaiLong(day) + (isToday ? " (วันนี้)" : "") + (closed ? " ร้านไม่ว่างวันนี้" : "")
                    }
                    aria-pressed={isSelected}
                    title={closed ? "ร้านไม่ว่างวันนี้" : undefined}
                    onClick={() => {
                      if (!closed) onPick(day);
                    }}
                    className={cn(
                      "cal-day numeric flex size-11 items-center justify-center rounded-full text-base",
                      isSelected
                        ? "bg-primary font-medium text-primary-foreground"
                        : "hover:bg-muted",
                      isToday && !isSelected && "border border-gold font-medium",
                      disabled && "pointer-events-none text-muted-foreground opacity-35",
                      closed &&
                        "cursor-not-allowed text-muted-foreground line-through decoration-1 opacity-50 hover:bg-transparent",
                    )}
                  >
                    {day.d}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {blocked.size > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          วันที่ขีดฆ่า ร้านไม่รับงาน
        </p>
      ) : null}
    </div>
  );
}

/**
 * ช่องเลือกวันที่แบบไทย (พ.ศ.) แทน <input type="date"> ที่แสดง mm/dd/yyyy ปี ค.ศ.
 * - ค่าที่ส่งกับฟอร์ม/server action เป็น "yyyy-mm-dd" (ค.ศ.) เหมือน input date ทุกประการ ผ่าน <input type="hidden" name>
 * - แสดง "23 ต.ค. 2569" ในช่อง แตะแล้วเปิดปฏิทินในแผ่นล่าง (เดสก์ท็อปเป็นกล่องกลางจอ) เลือกวันแล้วปิดเอง
 * - min / max: "yyyy-mm-dd" วันนอกช่วงกดไม่ได้ | defaultValue (ไม่ควบคุม) หรือ value + onChange (ควบคุม)
 * - disabledDates: ["yyyy-mm-dd"] วันที่ร้านปิดรับงาน แสดงขีดฆ่า กดไม่ได้ ปุ่มลูกศรข้ามให้ และมีคำอธิบายใต้ปฏิทิน
 * - ใส่ id ให้ตรงกับ <Label htmlFor> ได้ | aria-invalid / aria-describedby ส่งต่อไปที่ปุ่มช่อง (ใช้คู่ <FieldHint>)
 * - ข้อจำกัด: ไม่มี validation แบบ required ของเบราว์เซอร์ ให้ตรวจเองตอนกดปุ่ม (ดูรูปแบบใน FieldHint)
 */
export function ThaiDateField({
  name,
  id,
  value,
  defaultValue,
  onChange,
  min,
  max,
  disabledDates,
  placeholder = "เลือกวันที่",
  title = "เลือกวันที่",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  /** วันที่เลือกไม่ได้ (ร้านปิดรับงาน) "yyyy-mm-dd" */
  disabledDates?: string[];
  placeholder?: string;
  /** หัวข้อของแผ่นปฏิทิน */
  title?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}) {
  const autoId = useId();
  const [inner, setInner] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = value !== undefined ? value : inner;
  const parsed = parseYMD(current);
  const minYMD = parseYMD(min);
  const maxYMD = parseYMD(max);
  const blocked = new Set(disabledDates ?? []);

  function pick(day: YMD) {
    const next = toYMDString(day);
    if (value === undefined) setInner(next);
    onChange?.(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  const today = todayYMD();
  const todayOk =
    (!minYMD || compareYMD(today, minYMD) >= 0) &&
    (!maxYMD || compareYMD(today, maxYMD) <= 0) &&
    !blocked.has(toYMDString(today));

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        ref={buttonRef}
        id={id ?? autoId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        {...(ariaInvalid ? { "aria-invalid": ariaInvalid } : {})}
        aria-describedby={ariaDescribedBy}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-full border border-input bg-card px-5 text-left text-base transition-[border-color,box-shadow] outline-none hover:bg-muted focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground disabled:pointer-events-none disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className,
        )}
      >
        <span className={cn("numeric truncate", !parsed && "text-muted-foreground")}>
          {parsed ? formatThaiShort(parsed) : placeholder}
        </span>
        <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
      <BottomSheet title={title} open={open} onOpenChange={setOpen}>
        {open ? <MonthGrid selected={parsed} min={minYMD} max={maxYMD} blocked={blocked} onPick={pick} /> : null}
        {todayOk ? (
          <button
            type="button"
            onClick={() => pick(today)}
            className="-mt-1 min-h-11 self-start rounded-full px-4 text-base font-medium transition-colors hover:bg-muted"
          >
            เลือกวันนี้
          </button>
        ) : null}
      </BottomSheet>
    </>
  );
}

/**
 * ช่องเลือกวันและเวลา: วันที่แบบไทย (พ.ศ.) + เวลา (input time ของเบราว์เซอร์) ค่าที่ส่งเป็น "yyyy-mm-ddTHH:mm"
 * เหมือน <input type="datetime-local"> ว่างจนกว่าจะเลือกครบทั้งวันและเวลา
 */
export function ThaiDateTimeField({
  name,
  id,
  defaultValue,
  min,
  max,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  name?: string;
  id?: string;
  /** "yyyy-mm-ddTHH:mm" */
  defaultValue?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}) {
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(defaultValue?.slice(11, 16) ?? "");
  return (
    <div className={cn("flex gap-3", className)}>
      {name ? <input type="hidden" name={name} value={date && time ? `${date}T${time}` : ""} /> : null}
      <ThaiDateField
        id={id}
        value={date}
        onChange={setDate}
        min={min?.slice(0, 10)}
        max={max?.slice(0, 10)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className="min-w-0 flex-1"
      />
      <Input
        type="time"
        aria-label="เวลา"
        value={time}
        disabled={disabled}
        onChange={(event) => setTime(event.target.value)}
        aria-invalid={ariaInvalid}
        className="w-32 shrink-0 px-4"
      />
    </div>
  );
}
