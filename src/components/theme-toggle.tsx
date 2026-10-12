"use client";

import { useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { ThemeChoice } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeChoice; label: string; description: string; icon: LucideIcon }[] = [
  { value: "light", label: "สว่าง", description: "พื้นงาช้างนวล", icon: Sun },
  { value: "dark", label: "มืด", description: "ถนอมสายตาตอนกลางคืน", icon: Moon },
  { value: "system", label: "ตามระบบ", description: "เปลี่ยนตามเครื่องของคุณ", icon: Monitor },
];

const subscribe = () => () => {};

/** true เมื่อทำงานบน client แล้ว ใช้กันค่าธีมไม่ตรงกันระหว่าง server กับ client */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** สลับธีมแบบนุ่ม: ใส่คลาส theme-fade ชั่วครู่ให้สีไล่เปลี่ยนแทนการกระชาก */
function useThemeChoice() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current: ThemeChoice = mounted && (theme === "light" || theme === "dark") ? theme : "system";

  function choose(next: ThemeChoice) {
    if (next === current && mounted) return;
    const root = document.documentElement;
    root.classList.add("theme-fade");
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-fade"), 450);
  }
  return { current, choose, mounted };
}

/** ตัวอย่างหน้าจอย่อ แสดงสีของธีมนั้นจริง ไม่ขึ้นกับธีมที่ใช้อยู่ตอนนี้ */
function Swatch({ scheme }: { scheme: "light" | "dark" }) {
  return (
    <span
      className={cn(
        scheme,
        "absolute inset-0 flex flex-col gap-1.5 bg-background p-2 text-foreground",
      )}
      aria-hidden="true"
    >
      <span className="h-2 w-1/3 rounded-full bg-foreground" />
      <span className="flex flex-1 items-end gap-1.5 rounded-lg border border-border bg-card p-1.5">
        <span className="h-2 w-1/2 rounded-full bg-muted-foreground/50" />
        <span className="ml-auto size-3.5 rounded-full bg-gold" />
      </span>
    </span>
  );
}

function Preview({ value }: { value: ThemeChoice }) {
  return (
    <span className="relative block h-20 w-full overflow-hidden rounded-lg ring-1 ring-foreground/15">
      <Swatch scheme={value === "dark" ? "dark" : "light"} />
      {value === "system" ? (
        <span
          className="absolute inset-0"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        >
          <Swatch scheme="dark" />
        </span>
      ) : null}
    </span>
  );
}

/**
 * ตัวเลือกธีม สว่าง/มืด/ตามระบบ
 * - variant "cards" (ค่าเริ่มต้น): การ์ดใหญ่พร้อมตัวอย่างสี ใช้ในหน้าตั้งค่าการแสดงผล
 * - variant "icons": ปุ่มไอคอนสามปุ่มขนาดเล็ก ใช้แทรกในแถวเมนูหรือหน้าบัญชี
 * - variant "button": ปุ่มกลมปุ่มเดียวสลับสว่าง/มืด (40px) ใช้ในส่วนหัวเว็บเดสก์ท็อป
 */
export function ThemeToggle({
  variant = "cards",
  className,
}: {
  variant?: "cards" | "icons" | "button";
  className?: string;
}) {
  const { current, choose } = useThemeChoice();
  const { resolvedTheme } = useTheme();

  if (variant === "button") {
    // ปุ่มเดียวสลับสว่าง/มืด ใช้ในส่วนหัวเว็บเดสก์ท็อป (ตัวเลือก "ตามระบบ" อยู่ในตั้งค่า > การแสดงผล)
    // ไอคอนเลือกด้วยคลาส dark: จึงตรงกันทั้งตอน SSR และ client
    return (
      <button
        type="button"
        aria-label="สลับธีมสว่างหรือมืด"
        title="สลับธีมสว่างหรือมืด"
        onClick={() => choose(resolvedTheme === "dark" ? "light" : "dark")}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-background text-foreground transition-[transform,background-color] hover:bg-muted active:scale-95",
          className,
        )}
      >
        {/* สองไอคอนซ้อนกัน: ตอนสลับธีมอันเก่าหมุนหายไป อันใหม่หมุนเข้ามา */}
        <span className="relative block size-5">
          <Moon
            className="absolute inset-0 size-5 transition-[transform,opacity] duration-300 ease-soft dark:-rotate-90 dark:scale-50 dark:opacity-0"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <Sun
            className="absolute inset-0 size-5 rotate-90 scale-50 opacity-0 transition-[transform,opacity] duration-300 ease-soft dark:rotate-0 dark:scale-100 dark:opacity-100"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </span>
      </button>
    );
  }

  if (variant === "icons") {
    return (
      <div
        role="radiogroup"
        aria-label="ธีมสี"
        className="inline-flex shrink-0 gap-0.5 rounded-full border border-border p-1"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const on = current === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={label}
              title={label}
              onClick={() => choose(value)}
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-90",
                on
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={on ? 2.1 : 1.7} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="ธีมสี" className="grid grid-cols-3 gap-3">
      {OPTIONS.map(({ value, label, description }) => {
        const on = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => choose(value)}
            className={cn(
              "surface flex flex-col gap-2.5 p-2.5 pb-3 text-left",
              on ? "border-primary" : "hover:bg-muted",
            )}
          >
            <span className="relative block">
              <Preview value={value} />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border transition-colors",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card/80",
                )}
              >
                {on ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
            </span>
            <span className="px-1 text-center text-base font-medium whitespace-nowrap">{label}</span>
            <span className="sr-only">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
