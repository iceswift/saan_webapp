"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ListGroup } from "@/components/list-group";
import { updateNotificationSettings } from "@/server/actions/settings";
import { ToggleRow } from "../toggle-row";

type Prefs = { notifyOrders: boolean; notifyQuotes: boolean; notifyVows: boolean };

/** สวิตช์การแจ้งเตือน บันทึกทันทีทุกครั้งที่แตะ และคืนค่าเดิมถ้าบันทึกไม่สำเร็จ */
export function NotificationSettings({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);

  async function toggle(key: keyof Prefs) {
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const res = await updateNotificationSettings(next);
    if (!res.ok) {
      setPrefs(previous);
      toast.error(res.error);
    }
  }

  return (
    <ListGroup label="เลือกเรื่องที่อยากให้แจ้ง">
      <ToggleRow
        title="คำสั่งซื้อและงาน"
        description="ร้านยืนยัน ความคืบหน้า งานเสร็จ ข้อความจากร้าน"
        checked={prefs.notifyOrders}
        onToggle={() => toggle("notifyOrders")}
      />
      <ToggleRow
        title="ใบเสนอราคา"
        description="เมื่อร้านส่งใบเสนอราคาให้คำขอของคุณ"
        checked={prefs.notifyQuotes}
        onToggle={() => toggle("notifyQuotes")}
      />
      <ToggleRow
        title="สมุดบน"
        description="เตือนตามวันที่คุณตั้งไว้"
        checked={prefs.notifyVows}
        onToggle={() => toggle("notifyVows")}
      />
    </ListGroup>
  );
}
