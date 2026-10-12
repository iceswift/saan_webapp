import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** การ์ดตัวเลือกแบบเลือกได้หนึ่งอย่าง ใช้แทน Select เพื่อให้แตะง่ายและเห็นทุกตัวเลือก */
export function OptionCard({
  selected,
  onSelect,
  leading,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  leading?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 surface p-4 text-left transition-colors",
        description ? "min-h-18" : "min-h-14",
        selected ? "border-primary" : "hover:bg-muted",
      )}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{title}</span>
        {description ? (
          <span className="block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {selected ? <Check className="size-4" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
