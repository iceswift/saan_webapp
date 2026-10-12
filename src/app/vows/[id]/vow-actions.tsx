"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SoonBadge, SoonButton } from "@/components/coming-soon";
import { StatusLine } from "@/components/status-line";
import { Button } from "@/components/ui/button";
import { InlineConfirm } from "@/app/request/inline-confirm";
import type { VowStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { deleteVow, setVowStatus } from "@/server/actions/customer";

/** เส้นทางของรายการบน: บนไว้ แล้วรอผล เมื่อสมหวังจึงถึงเวลาแก้บน (เป็นเพียงบันทึกของผู้ใช้เอง) */
const STEPS = ["บนไว้", "สมหวัง", "แก้บนแล้ว"];
const STEP: Record<VowStatus, number> = { WAITING: 1, GRANTED: 2, FULFILLED: 3 };

export function VowActions({
  vowId,
  status,
  promise,
  updatedAt,
}: {
  vowId: string;
  status: VowStatus;
  promise: string;
  updatedAt: string;
}) {
  const [pending, startTransition] = useTransition();

  function move(next: VowStatus, doneMessage: string) {
    startTransition(async () => {
      const res = await setVowStatus({ vowId, status: next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(doneMessage);
    });
  }

  if (status === "WAITING") {
    return (
      <StatusLine title="รอผล" detail="กดเมื่อเรื่องที่ขอสำเร็จแล้ว" steps={STEPS} step={STEP[status]} tone="wait">
        <Button
          type="button"
          variant="gold"
          size="xl"
          className="w-full"
          loading={pending}
          onClick={() => move("GRANTED", "บันทึกว่าสมหวังแล้ว")}
        >
          สมหวังแล้ว
        </Button>
      </StatusLine>
    );
  }

  if (status === "GRANTED") {
    return (
      <div className="flex flex-col gap-4">
        <StatusLine
          title="สมหวังแล้ว ถึงเวลาแก้บน"
          detail={`สัญญาไว้: ${promise}`}
          steps={STEPS}
          step={STEP[status]}
          tone="wait"
        >
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="gold"
              size="xl"
              className="w-full"
              loading={pending}
              onClick={() => move("FULFILLED", "บันทึกว่าแก้บนเรียบร้อยแล้ว")}
            >
              แก้บนเรียบร้อยแล้ว
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xl"
              className="w-full text-muted-foreground"
              disabled={pending}
              onClick={() => move("WAITING", "กลับไปรอผลแล้ว")}
            >
              ยังไม่สมหวัง กลับไปรอผล
            </Button>
          </div>
        </StatusLine>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-muted-foreground">
          บริการช่วยจัดของและแก้บนแทน
          <SoonBadge />
        </p>
      </div>
    );
  }

  return (
    <StatusLine
      title="แก้บนเรียบร้อยแล้ว"
      detail={formatDate(updatedAt)}
      steps={STEPS}
      step={STEP[status]}
      tone="good"
    >
      <SoonButton className="w-full" message="การบันทึกเป็นภาพกำลังจะเปิดใช้ ขอบคุณที่รอ">
        บันทึกเป็นภาพ
      </SoonButton>
    </StatusLine>
  );
}

export function VowDeleteButton({ vowId }: { vowId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteVow({ vowId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push("/vows");
    });
  }

  return (
    <InlineConfirm
      triggerLabel="ลบรายการนี้"
      question="ลบรายการนี้ออกจากสมุดบนใช่ไหม"
      confirmLabel="ลบรายการ"
      pending={pending}
      onConfirm={remove}
    />
  );
}
