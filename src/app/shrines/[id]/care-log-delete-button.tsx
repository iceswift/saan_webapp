"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCareLog } from "@/server/actions/extras";

const linkClass =
  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60";

/** ลบบันทึกการดูแลแบบสองขั้น กดลบแล้วต้องยืนยันอีกครั้ง (ข้อความเล็ก ไม่แย่งความสนใจจากบันทึก) */
export function CareLogDeleteButton({ careLogId }: { careLogId: string }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteCareLog({ careLogId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบบันทึกแล้ว");
    });
  }

  if (!asking) {
    return (
      <button type="button" className={`${linkClass} -ml-3 text-muted-foreground`} onClick={() => setAsking(true)}>
        ลบบันทึกนี้
      </button>
    );
  }

  return (
    <div className="-ml-3 flex flex-wrap items-center gap-1">
      <span className="pl-3 text-sm">ลบบันทึกนี้ใช่ไหม</span>
      <button type="button" className={`${linkClass} text-muted-foreground`} disabled={pending} onClick={() => setAsking(false)}>
        ยกเลิก
      </button>
      <button type="button" className={`${linkClass} text-destructive`} disabled={pending} onClick={remove}>
        {pending ? "กำลังลบ" : "ลบ"}
      </button>
    </div>
  );
}
