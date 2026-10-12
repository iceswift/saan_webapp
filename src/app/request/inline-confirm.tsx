"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * ปุ่มที่ต้องยืนยันสองขั้น: กดครั้งแรกจะถามซ้ำในกรอบเดียวกัน
 * ใช้กับการกระทำที่ย้อนกลับไม่ได้ เช่น ลบ หรือปิดคำขอ
 */
export function InlineConfirm({
  triggerLabel,
  question,
  confirmLabel,
  confirmVariant = "destructive",
  pending,
  onConfirm,
}: {
  triggerLabel: React.ReactNode;
  question: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  pending: boolean;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xl"
        className="w-full text-muted-foreground"
        onClick={() => setAsking(true)}
      >
        {triggerLabel}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 surface p-4">
      <p className="text-base">{question}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={pending}
          onClick={() => setAsking(false)}
        >
          ยกเลิก
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          size="xl"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "กำลังดำเนินการ" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
