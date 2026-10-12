import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, type LegalSection } from "../legal-doc";

export const metadata: Metadata = { title: "นโยบายความเป็นส่วนตัว" };

const SECTIONS: LegalSection[] = [
  {
    heading: "ข้อมูลที่เราเก็บ",
    items: [
      "ชื่อ เบอร์โทรศัพท์ และที่อยู่",
      "รูปที่อัปโหลด",
      "ข้อมูลศาล",
      "รายการในสมุดบน",
      "ประวัติคำสั่งซื้อและข้อความ",
    ],
  },
  {
    heading: "เราใช้ข้อมูลเพื่ออะไร",
    items: [
      "ให้บริการ",
      "ส่งต่อข้อมูลที่จำเป็นให้ร้านที่คุณเลือก",
      "แจ้งเตือนในแอป",
    ],
  },
  {
    heading: "ใครเห็นข้อมูลอะไร",
    items: [
      "ร้านเห็นชื่อ เบอร์โทร ที่อยู่ และรายละเอียดงานของคำสั่งที่เกี่ยวข้อง",
      "สมุดบนเห็นได้เฉพาะคุณ",
    ],
  },
  {
    heading: "สิทธิของคุณ",
    paragraphs: [
      <>
        คุณดาวน์โหลดข้อมูล แก้ไข และลบบัญชีได้ที่ ตั้งค่า &gt;{" "}
        <Link href="/settings/privacy" className="font-medium text-gold-ink underline underline-offset-4">
          ความเป็นส่วนตัวและข้อมูลของฉัน
        </Link>
      </>,
    ],
  },
  {
    heading: "คุกกี้",
    paragraphs: ["ใช้คุกกี้ที่จำเป็นสำหรับการเข้าสู่ระบบและขนาดตัวอักษรเท่านั้น"],
  },
  {
    heading: "การเก็บรักษาข้อมูล",
    items: [
      "เมื่อลบบัญชี ข้อมูลส่วนตัวจะถูกลบ",
      "ประวัติคำสั่งซื้อที่เสร็จแล้วจะเก็บแบบไม่ระบุตัวตน",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="นโยบายความเป็นส่วนตัว"
      sections={SECTIONS}
      other={{ href: "/legal/terms", title: "ข้อกำหนดการใช้งาน" }}
    />
  );
}
