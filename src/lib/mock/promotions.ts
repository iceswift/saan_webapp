// UI-ONLY: no backend yet
// ตัวอย่างโปรโมชันบนหน้าแรก ใช้ทดสอบหน้าตาของส่วน "โปรโมชัน" เท่านั้น
// ต้องมี: ตาราง Promotion (title, description, discount, conditions, startsAt, endsAt, providerId?, active)
// + query listActivePromotions() และตัวคำนวณส่วนลดตอนสร้างคำสั่งซื้อ
// ทุกจุดที่แสดงข้อมูลนี้ต้องมี <SampleBadge /> เพราะลูกค้าอาจเข้าใจว่าเป็นส่วนลดจริง

import type { TileTint } from "@/components/visuals";

export type SamplePromotion = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  conditions: string[];
  tint: TileTint;
  icon: "gift" | "ticket" | "sparkles";
};

export const SAMPLE_PROMOTIONS: SamplePromotion[] = [
  {
    id: "first-order",
    title: "ลูกค้าใหม่ ลดค่าพิธี",
    summary: "ตัวอย่างส่วนลดสำหรับคำสั่งซื้อแรก",
    detail: "นี่คือตัวอย่างหน้าตาของโปรโมชัน ส่วนลดจริงจะแสดงที่นี่เมื่อระบบเปิดใช้งาน",
    conditions: ["ใช้ได้กับคำสั่งตั้งศาลใหม่", "ส่วนลดจะหักตอนยืนยันคำสั่งซื้อ"],
    tint: "amber",
    icon: "gift",
  },
  {
    id: "bundle",
    title: "ศาลพร้อมพิธี ราคาชุด",
    summary: "ตัวอย่างราคาพิเศษเมื่อเลือกศาลคู่กับพิธี",
    detail: "นี่คือตัวอย่างหน้าตาของโปรโมชัน ราคาชุดจริงจะกำหนดโดยร้านแต่ละร้าน",
    conditions: ["เลือกศาลและพิธีจากร้านเดียวกัน", "ร้านเป็นผู้กำหนดราคาชุด"],
    tint: "mint",
    icon: "ticket",
  },
];
