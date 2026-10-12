import { Check } from "lucide-react";
import { VOW_STATUS, type VowStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** ตราสถานะเล็ก ๆ แบบเงียบ: จุด (หรือเครื่องหมายถูก) + ข้อความ ไม่ใช่ป้ายสีสด */
export function VowStamp({ status }: { status: VowStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-sm whitespace-nowrap text-muted-foreground">
      {status === "FULFILLED" ? (
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", status === "GRANTED" ? "bg-gold" : "bg-muted-foreground")}
        />
      )}
      {VOW_STATUS[status]}
    </span>
  );
}
