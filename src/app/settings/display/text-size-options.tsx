"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setTextSize } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

/** เลือกขนาดตัวอักษร ผลจะเห็นทั้งแอปเมื่อหน้าโหลดใหม่ และตัวอย่างด้านล่างแสดงผลทันที */
export function TextSizeOptions({ initialLarge }: { initialLarge: boolean }) {
  const [large, setLarge] = useState(initialLarge);
  const [pending, startTransition] = useTransition();

  function choose(next: boolean) {
    if (next === large) return;
    const previous = large;
    setLarge(next);
    startTransition(async () => {
      const res = await setTextSize({ large: next });
      if (!res.ok) {
        setLarge(previous);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
        <SizeCard
          title="ขนาดปกติ"
          selected={!large}
          disabled={pending}
          sampleClass="text-base"
          onSelect={() => choose(false)}
        />
        <SizeCard
          title="ขนาดใหญ่"
          selected={large}
          disabled={pending}
          sampleClass="text-2xl"
          onSelect={() => choose(true)}
        />
      </div>

      <section className="border-t border-border pt-6">
        <h2 className="font-display text-xl font-normal">ตัวอย่าง</h2>
        <p className="mt-2 text-base">
          นี่คือข้อความตัวอย่าง ใช้ดูขนาดตัวอักษรที่คุณเลือกไว้ ตัวอักษรทั้งแอปจะเปลี่ยนตามขนาดนี้
        </p>
        <Button type="button" variant="secondary" size="xl" className="mt-4 w-full lg:w-auto" tabIndex={-1}>
          ปุ่มตัวอย่าง
        </Button>
      </section>
    </div>
  );
}

function SizeCard({
  title,
  selected,
  disabled,
  sampleClass,
  onSelect,
}: {
  title: string;
  selected: boolean;
  disabled: boolean;
  sampleClass: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "surface flex min-h-24 w-full items-center gap-4 p-5 text-left transition-colors disabled:opacity-60",
        selected ? "border-primary" : "hover:bg-muted",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{title}</span>
        <span className={cn("mt-1 block", sampleClass)}>ตัวอย่างข้อความ ก ข ค 123</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
          selected ? "border-primary bg-primary" : "border-input",
        )}
      >
        {selected ? <Check className="size-3.5 text-primary-foreground" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
