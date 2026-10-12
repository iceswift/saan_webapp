import { Landmark, ListChecks, Undo2, type LucideIcon } from "lucide-react";
import type { ArtName, Tint } from "@/components/visuals";

// เนื้อหาคู่มือ: ใช้ข้อความตามที่ทีมงานตรวจแล้วเท่านั้น ห้ามเพิ่มข้อเท็จจริงหรือตัวเลขใหม่

export const GUIDE_ICONS = {
  Landmark,
  ListChecks,
  Undo2,
} satisfies Record<string, LucideIcon>;
export type GuideIconName = keyof typeof GUIDE_ICONS;

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type GuideArticle = {
  slug: string;
  title: string;
  summary: string;
  icon: GuideIconName;
  tint: Tint;
  /** ภาพประกอบบนปกบทความ */
  art: ArtName;
  cta: { label: string; href: string };
  sections: GuideSection[];
};

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "shrine-types",
    title: "ศาลแต่ละแบบต่างกันอย่างไร",
    summary: "ศาลพระภูมิ ศาลเจ้าที่ และศาลพระพรหม",
    icon: "Landmark",
    tint: "mint",
    art: "shrine",
    cta: { label: "เลือกดูศาล", href: "/browse" },
    sections: [
      {
        heading: "ศาลพระภูมิ",
        paragraphs: [
          "ศาลเสาเดียว ตั้งเพื่อบูชาพระภูมิซึ่งเชื่อว่าเป็นเทพผู้ดูแลรักษาพื้นที่และผู้อยู่อาศัย นิยมตั้งกับบ้านพักอาศัย",
        ],
      },
      {
        heading: "ศาลเจ้าที่ หรือศาลตายาย",
        paragraphs: [
          "ศาลหลายเสา มักเตี้ยกว่าศาลพระภูมิ ตั้งเพื่อบูชาเจ้าที่หรือวิญญาณที่อยู่ในพื้นที่มาแต่เดิม หลายบ้านตั้งคู่กับศาลพระภูมิ",
        ],
      },
      {
        heading: "ศาลพระพรหม",
        paragraphs: [
          "ตั้งเพื่อบูชาท้าวมหาพรหม พบมากในอาคารขนาดใหญ่ โรงแรม และสถานประกอบการ",
        ],
      },
      {
        heading: "เลือกแบบไหนดี",
        paragraphs: [
          "ขึ้นกับความเชื่อของครอบครัว ประเภทสถานที่ และคำแนะนำของผู้ประกอบพิธี หากยังไม่แน่ใจ ร้านในระบบช่วยแนะนำก่อนยืนยันคำสั่งได้",
        ],
      },
    ],
  },
  {
    slug: "before-install",
    title: "เตรียมตัวก่อนตั้งศาล",
    summary: "ตำแหน่ง ฤกษ์ และของที่ต้องเตรียม",
    icon: "ListChecks",
    tint: "amber",
    art: "garland",
    cta: { label: "เริ่มตั้งศาลใหม่", href: "/new" },
    sections: [
      {
        heading: "เลือกตำแหน่ง",
        bullets: [
          "เว้นระยะจากรั้วและตัวบ้านพอสมควร",
          "ไม่ตั้งใกล้ห้องน้ำ ถังขยะ หรือบ่อพักน้ำทิ้ง",
          "นิยมเลือกจุดที่เงาของตัวบ้านไม่ทับศาล",
        ],
      },
      {
        heading: "ฤกษ์",
        paragraphs: [
          "ผู้ประกอบพิธีจะดูฤกษ์ให้เหมาะกับเจ้าของบ้าน ใน Saan คุณเลือกวันที่สะดวกได้สูงสุด 3 วัน แล้วร้านจะยืนยันวันและเวลา",
        ],
      },
      {
        heading: "ของที่ใช้ในพิธี",
        paragraphs: [
          "รายการขึ้นกับผู้ประกอบพิธี ตัวอย่างที่พบบ่อย เช่น มะพร้าวอ่อน กล้วยน้ำว้า ขนมต้มแดงต้มขาว ผลไม้ ข้าวสุก น้ำสะอาด ดอกไม้ ธูปและเทียน หากเลือกบริการเครื่องสังเวย ร้านจะจัดเตรียมให้",
        ],
      },
      {
        heading: "ค่าใช้จ่าย",
        paragraphs: [
          "แยกเป็นค่าศาล ค่าพิธี และเครื่องสังเวย ทุกรายการแสดงราคาก่อนยืนยัน มัดจำ 30% และจ่ายส่วนที่เหลือเมื่อตรวจรับงาน",
        ],
      },
    ],
  },
  {
    slug: "old-shrine",
    title: "ศาลเก่าทำอย่างไรดี",
    summary: "ถอน ย้าย และนำศาลเก่าไปไว้ที่เหมาะสม",
    icon: "Undo2",
    tint: "rose",
    art: "lotus",
    cta: { label: "ขอใบเสนอราคาถอนหรือย้ายศาล", href: "/request/new?type=REMOVE" },
    sections: [
      {
        heading: "ทำพิธีถอนก่อน",
        paragraphs: [
          "ก่อนรื้อหรือย้ายศาล นิยมให้ผู้ประกอบพิธีทำพิธีถอนหรือบอกกล่าวก่อน",
        ],
      },
      {
        heading: "นำศาลเก่าไปไว้ที่ไหน",
        paragraphs: [
          "บางวัดรับศาลเก่า ควรสอบถามวัดก่อนนำไป ไม่ควรทิ้งในที่สาธารณะหรือริมทาง",
        ],
      },
      {
        heading: "ให้ร้านจัดการ",
        paragraphs: [
          "ร้านในระบบเสนอราคาได้ทั้งพิธีถอน การขนย้าย และการนำศาลเก่าไปส่ง ส่งรูปและรายละเอียดเพื่อรับใบเสนอราคา",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): GuideArticle | null {
  return GUIDE_ARTICLES.find((article) => article.slug === slug) ?? null;
}

/** เวลาอ่านโดยประมาณ (นาที) คำนวณจากจำนวนตัวอักษรของเนื้อหาจริง ประมาณ 700 ตัวอักษรต่อนาที */
export function readingMinutes(article: GuideArticle): number {
  const text = article.sections
    .flatMap((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? [])])
    .join("");
  return Math.max(1, Math.round(Array.from(text).length / 700));
}
