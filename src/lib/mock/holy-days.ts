// UI-ONLY: no backend yet
// ตัวอย่างการ์ด "วันสำคัญที่จะถึง" บนหน้าแรก วันที่ในไฟล์นี้เป็นค่าตัวอย่าง ไม่ใช่ปฏิทินจริง
// ต้องมี: ตารางปฏิทินวันพระ/วันสำคัญทางศาสนา (หรือ API ปฏิทินจันทรคติ) + query listUpcomingHolyDays(limit)
// ทุกจุดที่แสดงข้อมูลนี้ต้องมี <SampleBadge /> เพราะลูกค้าอาจเข้าใจว่าเป็นวันจริง

export type SampleHolyDay = {
  /** YYYY-MM-DD */
  date: string;
  title: string;
};

export const SAMPLE_HOLY_DAYS: SampleHolyDay[] = [
  { date: "2026-10-14", title: "วันพระ" },
  { date: "2026-10-22", title: "วันพระ" },
  { date: "2026-10-29", title: "วันพระ" },
];
