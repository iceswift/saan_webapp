"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldHint,focusFirstInvalid } from "@/components/field-hint";
import type { ActionResult } from "@/lib/result";
import type { FinanceOrder } from "@/server/finance";
import { payoutOrder, reconcileMoneyOperation, refundOrder, sendOmiseTestPayout } from "@/server/actions/finance";

export function FinanceControls({ order, gateway, sandboxPayout=false }: { order: FinanceOrder; gateway: string; sandboxPayout?:boolean }) {
  const [pending, startTransition] = useTransition();
  const [accepted,setAccepted]=useState(false);
  const [policyError,setPolicyError]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const mock = gateway === "mock" && order.settlementGateway === "mock";
  const unresolved = order.operations.filter((operation) =>
    operation.gateway === gateway && ["PROCESSING", "PENDING", "UNKNOWN"].includes(operation.status),
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
    <div ref={root} className="mt-4 flex flex-wrap gap-3">
      {sandboxPayout && order.status==="COMPLETED" && order.paid===order.total && order.payoutStatus==="NOT_REQUESTED" ? <section className="w-full border-t border-border pt-4" aria-label="จ่ายร้าน Omise ทดสอบ">
        <p className="text-base font-medium">จ่ายร้านผ่าน Omise โหมดทดสอบ</p>
        <p className="mt-2 text-sm text-muted-foreground">นโยบายสมมติ: ไม่มีค่าคอมมิชชัน หักค่ารับชำระและค่าโอนจากยอดร้าน ยอดโอนไม่ใช่ยอดสุทธิที่ร้านได้รับ ใช้ผู้รับธนาคารสมมติที่ผูกไว้เท่านั้น</p>
        <label className="mt-3 flex min-h-11 items-center gap-3 text-base"><input type="checkbox" className="size-5" checked={accepted} onChange={event=>{setAccepted(event.target.checked);setPolicyError(false);}} aria-invalid={policyError} aria-describedby={order.id+"-payout-policy"}/>ยืนยันใช้นโยบายทดสอบนี้ ไม่มีการโอนเงินจริง</label>
        <FieldHint id={order.id+"-payout-policy"} error={policyError?"กรุณายืนยันนโยบายทดสอบก่อนส่งรายการ":null}/>
        <Button className="mt-3" size="xl" variant="outline" loading={pending} onClick={()=>{if(!accepted){setPolicyError(true);requestAnimationFrame(()=>focusFirstInvalid(root.current));return;}run(()=>sendOmiseTestPayout({orderId:order.id,policy:"SANDBOX_SHOP_ABSORBS_COSTS_V1"}),"บันทึกผลส่งรายการแล้ว ตรวจสถานะเดิมจนยืนยันจ่ายสำเร็จ");}}>ส่งรายการจ่ายร้านทดสอบครั้งเดียว</Button>
      </section>:null}
      {mock && order.status === "CANCELLED" && order.paid > 0 ? (
        <Button size="xl" variant="outline" loading={pending}
          onClick={() => run(() => refundOrder({ orderId: order.id }), "บันทึกผลการคืนเงินทดสอบแล้ว")}>
          จำลองคืนเงิน
        </Button>
      ) : null}
      {mock && order.status === "COMPLETED" && order.payable > 0 ? (
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
