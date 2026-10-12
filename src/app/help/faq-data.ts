import {
  Ban,
  BookHeart,
  CalendarDays,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Tint } from "@/components/visuals";
import { DEPOSIT_RATE } from "@/lib/constants";

// เนื้อหาหน้าช่วยเหลือ: คำตอบต้องตรงกับพฤติกรรมจริงของระบบ ห้ามเปลี่ยนความหมาย

const DEPOSIT_PERCENT = Math.round(DEPOSIT_RATE * 100);

export const HELP_STEPS: { label: string; description?: string }[] = [
  { label: "เลือกบริการและตอบคำถามสั้น ๆ" },
  { label: `เลือกร้านและจ่ายมัดจำ ${DEPOSIT_PERCENT}%` },
  { label: "ร้านทำงาน ส่งรูปความคืบหน้า แล้วคุณตรวจรับ" },
];

export type FaqItem = { icon: LucideIcon; tint: Tint; question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    icon: Wallet,
    tint: "mint",
    question: "มัดจำเท่าไร และจ่ายเมื่อไร",
    answer: `มัดจำ ${DEPOSIT_PERCENT}% ของยอดรวม จ่ายหลังยืนยันคำสั่งซื้อ ส่วนที่เหลือจ่ายเมื่อคุณตรวจรับงาน`,
  },
  {
    icon: Ban,
    tint: "amber",
    question: "ยกเลิกคำสั่งได้ไหม",
    answer:
      "ยกเลิกได้เองจนกว่าร้านจะยืนยันคำสั่ง หากจ่ายมัดจำแล้ว ทีมงานจะติดต่อเพื่อคืนมัดจำ หลังร้านยืนยันแล้วให้ส่งข้อความหาร้านในหน้าคำสั่งซื้อ",
  },
  {
    icon: CalendarDays,
    tint: "rose",
    question: "ใครเป็นคนกำหนดฤกษ์",
    answer:
      "คุณเลือกวันที่สะดวกได้สูงสุด 3 วัน ร้านหรือผู้ประกอบพิธีจะยืนยันวันและเวลาจากวันที่คุณเลือก",
  },
  {
    icon: ShieldCheck,
    tint: "sky",
    question: "ร้านในระบบผ่านการตรวจสอบอย่างไร",
    answer: "ทีมงานตรวจสอบข้อมูลร้านก่อนอนุมัติ ร้านที่ผ่านแล้วจะมีป้ายตรวจสอบแล้ว",
  },
  {
    icon: ReceiptText,
    tint: "violet",
    question: "ขอใบเสนอราคาซ่อมหรือถอนย้ายทำอย่างไร",
    answer:
      "ส่งรูปและรายละเอียด ร้านในพื้นที่จะเสนอราคากลับมา คุณเลือกร้านที่ต้องการแล้วจ่ายมัดจำ",
  },
  {
    icon: BookHeart,
    tint: "rose",
    question: "สมุดบนมีใครเห็นบ้าง",
    answer: "เห็นได้เฉพาะคุณ",
  },
  {
    icon: MapPin,
    tint: "mint",
    question: "ให้บริการพื้นที่ไหน",
    answer: "ช่วงแรกให้บริการในกรุงเทพมหานคร นนทบุรี ปทุมธานี และสมุทรปราการ",
  },
];

