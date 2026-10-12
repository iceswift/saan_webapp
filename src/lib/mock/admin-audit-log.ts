// UI-ONLY: no backend yet
// บันทึกกิจกรรมของทีมงานตัวอย่าง ใช้แสดงหน้าตาของส่วน "กิจกรรมล่าสุด" ในหน้าผู้ดูแลระบบเท่านั้น
// ต้องมี: ตาราง AuditLog (actorId, action, targetType, targetId, summary, createdAt)
// + เขียนบันทึกทุกครั้งใน setProviderStatus / markRefunded + query listAuditLog()
// ทุกจุดที่แสดงข้อมูลนี้ต้องมี <SampleBadge /> เพราะอาจถูกเข้าใจว่าเป็นประวัติจริง

export type SampleAuditEntry = {
  id: string;
  kind: "approve" | "refund" | "suspend";
  summary: string;
  actor: string;
  /** จำนวนนาทีที่ผ่านมา ใช้แสดงคำว่า "เมื่อ x นาทีที่แล้ว" เพื่อไม่ต้องอ้างวันที่จริง */
  minutesAgo: number;
};

export const SAMPLE_AUDIT_LOG: SampleAuditEntry[] = [
  { id: "a1", kind: "approve", summary: "อนุมัติผู้ให้บริการ (ตัวอย่าง)", actor: "ทีมงาน", minutesAgo: 25 },
  { id: "a2", kind: "refund", summary: "บันทึกการคืนมัดจำ (ตัวอย่าง)", actor: "ทีมงาน", minutesAgo: 190 },
  { id: "a3", kind: "suspend", summary: "ระงับผู้ให้บริการชั่วคราว (ตัวอย่าง)", actor: "ทีมงาน", minutesAgo: 1560 },
];

export function agoLabel(minutes: number): string {
  if (minutes < 60) return `เมื่อ ${minutes} นาทีที่แล้ว`;
  if (minutes < 1440) return `เมื่อ ${Math.round(minutes / 60)} ชั่วโมงที่แล้ว`;
  return `เมื่อ ${Math.round(minutes / 1440)} วันที่แล้ว`;
}
