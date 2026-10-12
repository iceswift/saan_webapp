import { cn } from "@/lib/utils";

export type Segment = { key: string; label: string; value: number; dot: string };

/** แถบสัดส่วนซ้อนกันแนวนอน พร้อมคำอธิบายสี วาดด้วย CSS จากตัวเลขจริง */
export function StackedBar({ segments, emptyLabel }: { segments: Segment[]; emptyLabel: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <p className="text-base text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div>
      <div
        role="img"
        aria-label={segments.filter((s) => s.value > 0).map((s) => `${s.label} ${s.value}`).join(" ")}
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span
              key={s.key}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", s.dot)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-start gap-2 text-sm">
            <span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", s.dot)} />
            <span className="min-w-0 flex-1 text-muted-foreground">{s.label}</span>
            <span className="numeric font-medium text-foreground">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type Bar = { key: string; label: string; value: number; display: string };

/** แท่งกราฟรายเดือน วาดด้วย CSS ความสูงเป็นสัดส่วนของค่าสูงสุด */
export function MonthBars({ bars, emptyLabel }: { bars: Bar[]; emptyLabel: string }) {
  const max = Math.max(...bars.map((b) => b.value), 0);
  if (max === 0) {
    return <p className="text-base text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul
      className="grid items-end gap-2 sm:gap-4"
      style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
      aria-label="มูลค่างานรายเดือน"
    >
      {bars.map((b, i) => (
        <li key={b.key} className="flex flex-col items-center gap-2">
          <span className="numeric text-sm font-medium">{b.value > 0 ? b.display : ""}</span>
          <span className="flex h-32 w-full items-end px-1.5 sm:px-3 border-b border-border">
            <span
              className={cn(
                "w-full rounded-t-md",
                i === bars.length - 1 ? "bg-foreground" : "bg-foreground/25",
                b.value === 0 && "h-0.5 rounded-full bg-border",
              )}
              style={b.value > 0 ? { height: `${Math.max((b.value / max) * 100, 4)}%` } : undefined}
            />
          </span>
          <span className="text-center text-sm text-muted-foreground">{b.label}</span>
        </li>
      ))}
    </ul>
  );
}
