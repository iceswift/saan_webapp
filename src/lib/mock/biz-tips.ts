// UI-ONLY: no backend yet
// ข้อความแนะนำการดูแลลูกค้าและเวลาเปิดร้านตัวอย่าง ใช้แสดงหน้าตาของส่วนนี้ในหน้าร้านเท่านั้น
// ต้องมี: ตาราง ShopHours (providerId, weekday, opensAt, closesAt, closed) + action บันทึกเวลาเปิดร้าน
// เคล็ดลับเป็นข้อความทั่วไป ไม่ใช่สถิติ จึงไม่ต้องมี SampleBadge แต่เวลาเปิดร้านต้องมี เพราะลูกค้าอาจเข้าใจว่าเป็นเวลาจริง

import type { TileTint } from "@/components/visuals";

export type BizTip = {
  id: string;
  title: string;
  detail: string;
  icon: "camera" | "message" | "clock";
  tint: TileTint;
};

export const BIZ_TIPS: BizTip[] = [
  {
    id: "reply-fast",
    title: "ตอบลูกค้าให้เร็ว",
    detail: "ยืนยันรับงานและตอบข้อความภายในวันเดียว ลูกค้าจะวางใจมากขึ้น",
    icon: "message",
    tint: "sky",
  },
  {
    id: "photo-each-step",
    title: "ถ่ายรูปทุกขั้นตอน",
    detail: "รูปก่อนและหลังทำงาน ช่วยให้ลูกค้าตรวจรับงานได้ง่าย",
    icon: "camera",
    tint: "amber",
  },
  {
    id: "on-time",
    title: "ไปตามเวลานัด",
    detail: "ถ้าต้องเลื่อนนัด ให้แจ้งลูกค้าในแชตก่อนถึงวัน",
    icon: "clock",
    tint: "mint",
  },
];

export type SampleOpeningDay = { weekday: string; hours: string; closed: boolean };

export const SAMPLE_OPENING_HOURS: SampleOpeningDay[] = [
  { weekday: "จันทร์ - ศุกร์", hours: "08:30 - 17:30 น.", closed: false },
  { weekday: "เสาร์", hours: "09:00 - 15:00 น.", closed: false },
  { weekday: "อาทิตย์", hours: "หยุด", closed: true },
];
