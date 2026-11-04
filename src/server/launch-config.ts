import "server-only";
import { isIP } from "node:net";
import { normalizeThaiPhone } from "@/lib/phone-input";

type Environment = Record<string, string | undefined>;
export type SupportContact = { kind: "email" | "phone" | "line"; label: string; value: string; href: string };

/** Only explicitly configured public contacts are returned; malformed values never become links. */
export function supportConfiguration(env: Environment = process.env) {
  const contacts: SupportContact[] = [];
  const invalid: string[] = [];
  const email = (env.SUPPORT_EMAIL ?? "").trim();
  if (email) {
    const local = email.split("@")[0];
    if (email.length <= 254 && local.length <= 64 && !local.endsWith(".") && !local.includes("..") && /^[a-z\d][a-z\d._+-]*@[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)+$/i.test(email)) contacts.push({ kind: "email", label: "อีเมล", value: email, href: `mailto:${encodeURIComponent(email)}` });
    else invalid.push("อีเมล");
  }
  const rawPhone = (env.SUPPORT_PHONE ?? "").trim();
  if (rawPhone) {
    const phone = normalizeThaiPhone(rawPhone);
    if (/^0\d{9}$/.test(phone)) contacts.push({ kind: "phone", label: "โทรศัพท์", value: phone, href: `tel:+66${phone.slice(1)}` });
    else invalid.push("โทรศัพท์");
  }
  const line = (env.SUPPORT_LINE_URL ?? "").trim();
  if (line) {
    try {
      const url = new URL(line);
      const official = (url.hostname === "lin.ee" && /^\/[a-z\d_-]+\/?$/i.test(url.pathname)) || (url.hostname === "line.me" && /^\/(?:R\/)?ti\/p\/[^/?#]+$/.test(url.pathname));
      if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || !official) throw new Error("Invalid contact link");
      contacts.push({ kind: "line", label: "LINE", value: "ติดต่อผ่าน LINE", href: url.href });
    } catch { invalid.push("LINE"); }
  }
  return { contacts, invalid };
}

function publicOrigin(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? "");
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    return url.protocol === "https:" && !url.username && !url.password && !url.port && url.pathname === "/" && !url.search && !url.hash &&
      !isIP(host.replace(/^\[|\]$/g, "")) && host.includes(".") && !/(?:^|\.)(?:localhost|local|internal|test|invalid|example|ts\.net)$/.test(host) && !/^(?:www\.)?example\.(?:com|org|net)$/.test(host);
  } catch { return false; }
}

export type LaunchCheck = { id: string; title: string; state: "configured" | "missing" | "blocked" | "invalid"; detail: string };
/** Configuration inventory only. It never certifies DNS, ownership, delivery or live payments. */
export function launchConfiguration(env: Environment = process.env): { canLaunch: false; checks: LaunchCheck[] } {
  const support = supportConfiguration(env);
  const smsInvalid = (env.SMS_PROVIDER && env.SMS_PROVIDER !== "unconfigured") || env.SMS_SEND_ENABLED === "true";
  return { canLaunch: false, checks: [
    { id: "domain", title: "โดเมนสาธารณะ", state: publicOrigin(env.SITE_URL) ? "configured" : "missing", detail: publicOrigin(env.SITE_URL) ? "รูปแบบโดเมนพร้อมตั้งค่า ยังต้องตรวจ DNS และ HTTPS จริง" : "ยังไม่มีโดเมนสาธารณะที่ตั้งค่าไว้ ลิงก์ส่วนตัวใช้ทดสอบต่อได้" },
    { id: "sms", title: "เข้าสู่ระบบด้วย SMS", state: smsInvalid ? "invalid" : "blocked", detail: smsInvalid ? "พบการตั้งค่าเปิดส่งหรือเลือกบริการ แต่ยังไม่มีอะแดปเตอร์ที่รองรับ ระบบไม่เปิดส่งจริง" : "ยังไม่มีบริการส่ง OTP จริง เข้าสู่ระบบได้เฉพาะบัญชีทดสอบที่กำหนด" },
    { id: "support", title: "ช่องทางช่วยเหลือลูกค้า", state: support.invalid.length ? "invalid" : support.contacts.length ? "configured" : "missing", detail: support.invalid.length ? `ตรวจสอบรูปแบบช่องทาง: ${support.invalid.join(" · ")}` : support.contacts.length ? "มีช่องทางที่ตั้งค่าไว้ ต้องยืนยันว่าทีมงานรับเรื่องได้จริงก่อนเปิดใช้" : "ยังไม่มีช่องทางจริง จะไม่แสดงอีเมล เบอร์โทร หรือ LINE สมมติ" },
    { id: "alerts", title: "แจ้งเตือนผู้ดูแลภายนอก", state: "blocked", detail: "ยังไม่ได้เชื่อมต่อผู้รับแจ้งเตือน ผลตรวจระบบแสดงเฉพาะในหน้านี้" },
    { id: "payments", title: "รับและจ่ายเงินจริง", state: "blocked", detail: "ยังไม่เปิดใช้เงินจริง ต้องยืนยันบัญชี รูปแบบธุรกิจ และเงื่อนไขกับผู้ให้บริการก่อน" },
    { id: "offsite", title: "สำรองข้อมูลนอกเครื่อง", state: "blocked", detail: "ยังไม่มีปลายทางที่ได้รับอนุญาต สำรองข้อมูลอยู่บน home server ตามที่กำหนดไว้" },
  ] };
}
