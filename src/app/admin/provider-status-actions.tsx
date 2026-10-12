"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProviderStatus } from "@/lib/constants";
import { setProviderStatus } from "@/server/actions/admin";

type Action = {
  next: ProviderStatus;
  label: string;
  variant: "default" | "outline";
};

const ACTIONS: Record<ProviderStatus, Action[]> = {
  PENDING: [
    { next: "VERIFIED", label: "อนุมัติ", variant: "default" },
    { next: "REJECTED", label: "ไม่อนุมัติ", variant: "outline" },
  ],
  VERIFIED: [{ next: "REJECTED", label: "ระงับ", variant: "outline" }],
  REJECTED: [{ next: "PENDING", label: "กลับไปรอตรวจสอบ", variant: "outline" }],
};

/** ปุ่มเปลี่ยนสถานะผู้ให้บริการ ปุ่มที่แสดงขึ้นกับสถานะปัจจุบัน (อนุมัติเป็นปุ่มหลัก ไม่อนุมัติเป็นปุ่มเส้นขอบ ไม่ใช้สีแดงทั้งแถว) */
export function ProviderStatusActions({
  providerId,
  status,
  compact = false,
}: {
  providerId: string;
  status: ProviderStatus;
  /** true = ปุ่มเล็กเรียงแถวเดียว สำหรับแถวของตารางบนเดสก์ท็อป */
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function change(next: ProviderStatus) {
    startTransition(async () => {
      const res = await setProviderStatus({ providerId, status: next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("เปลี่ยนสถานะแล้ว");
    });
  }

  const actions = ACTIONS[status];
  return (
    <div
      className={cn(
        compact ? "flex flex-row justify-end gap-2" : "grid gap-2",
        !compact && actions.length > 1 && "grid-cols-2",
      )}
    >
      {actions.map((action) => (
        <Button
          key={action.next}
          type="button"
          size={compact ? "lg" : "xl"}
          variant={action.variant}
          disabled={pending}
          onClick={() => change(action.next)}
          className={compact ? "px-4 text-sm whitespace-nowrap lg:min-h-9" : "px-4"}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
