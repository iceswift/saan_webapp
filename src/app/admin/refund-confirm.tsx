"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markRefunded } from "@/server/actions/admin";

/** ปุ่มบันทึกว่าคืนมัดจำแล้ว ต้องยืนยันซ้ำก่อนส่งคำสั่ง (compact = แถวเดียวในตาราง) */
export function RefundConfirm({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await markRefunded({ orderId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกการคืนมัดจำแล้ว");
    });
  }

  if (!asking) {
    return (
      <Button
        type="button"
        size={compact ? "lg" : "xl"}
        className={compact ? "px-4 text-sm whitespace-nowrap lg:min-h-9" : "w-full"}
        onClick={() => setAsking(true)}
      >
        บันทึกว่าคืนเงินแล้ว
      </Button>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm whitespace-nowrap text-muted-foreground">โอนคืนแล้วใช่ไหม</span>
        <Button type="button" variant="outline" size="lg" className="px-4 text-sm lg:min-h-9" disabled={pending} onClick={() => setAsking(false)}>
          ยกเลิก
        </Button>
        <Button type="button" size="lg" className="px-4 text-sm lg:min-h-9" loading={pending} onClick={confirm}>
          ยืนยัน
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 surface-quiet p-4">
      <p className="text-base">โอนเงินคืนลูกค้าแล้วใช่ไหม ระบบจะแจ้งลูกค้าว่าคืนมัดจำเรียบร้อย</p>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" size="xl" disabled={pending} onClick={() => setAsking(false)}>
          ยกเลิก
        </Button>
        <Button type="button" size="xl" loading={pending} onClick={confirm}>
          ยืนยัน
        </Button>
      </div>
    </div>
  );
}
