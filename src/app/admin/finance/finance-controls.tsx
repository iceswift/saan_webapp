"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/result";
import type { FinanceOrder } from "@/server/finance";
import { payoutOrder, reconcileMoneyOperation, refundOrder } from "@/server/actions/finance";

export function FinanceControls({ order, mock }: { order: FinanceOrder; mock: boolean }) {
  const [pending, startTransition] = useTransition();
  if (!mock) return null;
  const unresolved = order.operations.filter((operation) =>
    ["PROCESSING", "PENDING", "UNKNOWN"].includes(operation.status),
  );

  function run(action: () => Promise<ActionResult>, message: string) {
    if (pending) return;
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) { toast.error(result.error); return; }
        toast.success(message);
      } catch {
        toast.error("ดำเนินการไม่สำเร็จ กรุณาตรวจสอบสถานะรายการก่อนลองอีกครั้ง");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {order.status === "CANCELLED" && order.paid > 0 ? (
        <Button size="xl" variant="outline" loading={pending}
          onClick={() => run(() => refundOrder({ orderId: order.id }), "บันทึกผลการคืนเงินทดสอบแล้ว")}>
          จำลองคืนเงิน
        </Button>
      ) : null}
      {order.status === "COMPLETED" && order.payable > 0 ? (
        <Button size="xl" variant="outline" loading={pending}
          onClick={() => run(() => payoutOrder({ orderId: order.id }), "บันทึกผลการจ่ายให้ร้านทดสอบแล้ว")}>
          จำลองจ่ายให้ร้าน
        </Button>
      ) : null}
      {unresolved.map((operation, index) => (
        <Button key={operation.id} size="xl" variant="outline" loading={pending}
          onClick={() => run(() => reconcileMoneyOperation({ operationId: operation.id }), "ตรวจสอบสถานะรายการแล้ว")}>
          ตรวจสอบรายการค้าง {unresolved.length > 1 ? index + 1 : ""}
        </Button>
      ))}
    </div>
  );
}
