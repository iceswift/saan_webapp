// UI-ONLY: no backend yet
// ตัวเลือกของหน้า "ตั้งรอบเตือนดูแลศาล" ในหน้ารายละเอียดศาล ใช้แสดงหน้าจอเท่านั้น ยังไม่มีการบันทึกหรือส่งการเตือนจริง
// ต้องมี: ตาราง CareRoutine (shrineId, activity, everyDays, nextDueAt) + job สร้างการแจ้งเตือนในแอปเมื่อครบรอบ
// + server action setCareRoutine / clearCareRoutine ในขณะที่ยังไม่มี ปุ่มบันทึกต้องเป็น SoonButton
// ตัวเลือกกิจกรรมตรงกับ "เลือกเร็ว" ของฟอร์มบันทึกการดูแล รอบวันเป็นตัวเลือกให้ผู้ใช้เลือกเอง ไม่ใช่คำแนะนำทางพิธีกรรม

export const SAMPLE_ROUTINE_ACTIVITIES = [
  "เปลี่ยนพวงมาลัย",
  "ทำความสะอาด",
  "ถวายของไหว้",
  "เปลี่ยนน้ำ",
] as const;

export const SAMPLE_ROUTINE_INTERVALS: { days: number; label: string }[] = [
  { days: 7, label: "ทุกสัปดาห์" },
  { days: 14, label: "ทุก 2 สัปดาห์" },
  { days: 30, label: "ทุกเดือน" },
];
