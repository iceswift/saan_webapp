"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { REFUND_CASE_LABELS } from "@/lib/refund-case";
import { formatBaht, formatDateTime } from "@/lib/format";
import { updateRefundCase } from "@/server/actions/finance";
import type { RefundCaseView } from "@/server/finance";
import type { RefundCaseInput } from "@/server/refund-case-service";

export function RefundCaseControls({ operationId, amountMinor, refundCase: entry }: {
  operationId: string; amountMinor: number; refundCase: RefundCaseView | null;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const prefix = entry?.status === "SENT_UNVERIFIED" ? "TEST-VERIFY" : entry?.status === "APPROVED" ? "TEST-TRANSFER" : "TEST-DEST";
  const needsInput = !entry || ["NEEDS_DETAILS", "DETAILS_RECEIVED", "DETAILS_VERIFIED", "APPROVED", "SENT_UNVERIFIED"].includes(entry.status);
  function run(input: RefundCaseInput) {
    startTransition(async () => {
      try {
        const result = await updateRefundCase(input);
        if (!result.ok) { toast.error(result.error); return; }
        setValue(""); setEvidence(""); setError(null);
        toast.success("บันทึกขั้นตอนทดสอบแล้ว ไม่มีการโอนเงินจริง");
      } catch { toast.error("บันทึกไม่สำเร็จ กรุณาโหลดข้อมูลล่าสุดก่อนทำต่อ"); }
    });
  }
  function submit() {
    if (!entry) { run({action:"OPEN",operationId,amountMinor}); return; }
    const base = {caseId:entry.id,version:entry.version};
    const valid = (text: string, p: string) => new RegExp(`^${p}-[A-Z0-9-]{3,60}$`).test(text);
    if (!valid(value,prefix) || (entry.status === "APPROVED" && !valid(evidence,"TEST-EVIDENCE"))) {
      setError("กรุณากรอกรหัสสมมติตามรูปแบบที่ระบุ ห้ามใส่ข้อมูลธนาคารจริง");
      requestAnimationFrame(() => focusFirstInvalid(form.current)); return;
    }
    if (entry.status === "APPROVED") run({...base,action:"SEND",reference:value,evidence});
    else if (entry.status === "SENT_UNVERIFIED") run({...base,action:"COMPLETE",verification:value});
    else run({...base,action:"DETAILS",destination:value});
  }
  return <section className="mt-5 border-t border-border pt-4" aria-label="เคสคืนเงินทดสอบ">
    <h3 className="text-base font-medium">เคสคืนเงินทดสอบ · {formatBaht(amountMinor / 100)}</h3>
    <p className="mt-2 text-sm text-muted-foreground">ใช้ข้อมูลสมมติเท่านั้น ไม่ส่งคำสั่งธนาคาร ไม่ปิดยอดค้างคืนจริง และไม่เปลี่ยนสถานะการชำระเงิน Omise</p>
    {entry ? <p className="mt-3 text-base" role="status">{REFUND_CASE_LABELS[entry.status] ?? "รอตรวจสอบ"}</p> : null}
    {entry?.destination ? <p className="mt-2 text-sm text-muted-foreground">ปลายทางสมมติ {entry.destination}</p> : null}
    {entry?.transferReference ? <p className="mt-2 break-all text-sm text-muted-foreground">เลขส่งทดสอบ {entry.transferReference} · หลักฐาน {entry.evidence}</p> : null}
    {needsInput && entry?.status !== "TEST_COMPLETED" ? <form ref={form} className="mt-4 space-y-3" onSubmit={event => {event.preventDefault();submit();}}>
      {entry ? <>
        <label className="block text-base font-medium" htmlFor={`${operationId}-value`}>{prefix === "TEST-DEST" ? "รหัสปลายทางสมมติ" : prefix === "TEST-VERIFY" ? "รหัสตรวจยืนยันหลักฐานสมมติ" : "เลขอ้างอิงการส่งสมมติ"}</label>
        <Input id={`${operationId}-value`} value={value} onChange={event => {setValue(event.target.value);setError(null);}} placeholder={`${prefix}-QA001`} aria-invalid={Boolean(error)} aria-describedby={`${operationId}-hint`} />
        {entry.status === "APPROVED" ? <><label className="block text-base font-medium" htmlFor={`${operationId}-evidence`}>รหัสหลักฐานสมมติ</label><Input id={`${operationId}-evidence`} value={evidence} onChange={event => {setEvidence(event.target.value);setError(null);}} placeholder="TEST-EVIDENCE-QA001" aria-invalid={Boolean(error)} aria-describedby={`${operationId}-hint`} /></> : null}
        <FieldHint id={`${operationId}-hint`} error={error}>{prefix}- ตามด้วยตัวอักษรอังกฤษพิมพ์ใหญ่หรือตัวเลขอย่างน้อย 3 ตัว การเปลี่ยนปลายทางต้องตรวจและอนุมัติใหม่</FieldHint>
      </> : null}
      <Button size="xl" variant="outline" loading={pending} type="submit">{!entry ? "เปิดเคสทดสอบเต็มยอด" : entry.status === "APPROVED" ? "จำลองส่งเงินและบันทึกหลักฐาน" : entry.status === "SENT_UNVERIFIED" ? "ยืนยันจบขั้นตอนทดสอบ" : "บันทึกปลายทางสมมติ"}</Button>
    </form> : null}
    {entry && ["DETAILS_RECEIVED","DETAILS_VERIFIED"].includes(entry.status) ? <Button className="mt-3" size="xl" loading={pending} onClick={() => run({caseId:entry.id,version:entry.version,action:entry.status === "DETAILS_RECEIVED" ? "VERIFY" : "APPROVE"})}>{entry.status === "DETAILS_RECEIVED" ? "ยืนยันตรวจข้อมูลทดสอบ" : "อนุมัติเคสทดสอบ"}</Button> : null}
    {entry ? <details className="mt-4"><summary className="min-h-11 cursor-pointer py-2">ประวัติเคสทดสอบ {entry.events.length} รายการ</summary><ol className="divide-y divide-border">{entry.events.map(event => <li key={event.id} className="py-3"><p className="text-base">{REFUND_CASE_LABELS[event.toStatus] ?? "รอตรวจสอบ"}</p><p className="mt-1 break-all text-sm text-muted-foreground">{formatDateTime(new Date(event.createdAt))} · ผู้ดำเนินการ {event.actorId}{event.note ? ` · ${event.note}` : ""}</p></li>)}</ol></details> : null}
  </section>;
}
