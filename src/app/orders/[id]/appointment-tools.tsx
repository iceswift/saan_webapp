"use client";

import { useState } from "react";
import { CalendarPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AppointmentTools({ orderId, summary }: { orderId: string; summary: string }) {
  const [loading, setLoading] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  async function download() {
    setLoading(true);
    try {
      const response = await fetch(`/orders/${encodeURIComponent(orderId)}/calendar`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "บันทึกวันนัดไม่ได้ กรุณาลองใหม่");
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = "saan-appointment.ics"; document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success("ดาวน์โหลดวันนัดแล้ว เปิดไฟล์เพื่อเพิ่มในแอปปฏิทิน");
    } catch { toast.error("บันทึกวันนัดไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ"); }
    finally { setLoading(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(summary); toast.success("คัดลอกสรุปนัดแล้ว"); }
    catch { setManualCopy(true); }
  }
  return <div className="mt-6 border-t border-border pt-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button size="xl" variant="outline" loading={loading} onClick={download}><CalendarPlus aria-hidden="true" />บันทึกลงปฏิทิน</Button>
      <Button size="xl" variant="outline" onClick={copy}><Copy aria-hidden="true" />คัดลอกสรุปนัด</Button>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">ไฟล์วันนัดมีที่อยู่หน้างาน เลือกปฏิทินส่วนตัวเมื่อนำเข้า หากเลื่อนหรือยกเลิกนัด ต้องแก้ในปฏิทินเอง ยังไม่ซิงก์อัตโนมัติ</p>
    {manualCopy ? <div className="mt-3">
      <label htmlFor="appointment-summary" className="text-sm text-muted-foreground">คัดลอกอัตโนมัติไม่ได้ แตะเลือกข้อความด้านล่างเพื่อคัดลอก</label>
      <textarea id="appointment-summary" readOnly value={summary} rows={6} onFocus={event => event.currentTarget.select()} className="mt-2 w-full rounded-2xl border border-input bg-background p-4 text-base" />
    </div> : null}
  </div>;
}
