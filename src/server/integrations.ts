import "server-only";
import { randomBytes } from "node:crypto";
import type { PaymentMethod } from "@/lib/constants";

// จุดเชื่อมต่อบริการภายนอก ตอนนี้เป็นตัวจำลองทั้งหมด
// เมื่อมีบัญชีผู้ให้บริการจริง ให้เขียนตัวจริงตาม interface เดิมแล้วสลับที่ท้ายไฟล์

export interface SmsSender {
  sendOtp(phone: string, code: string): Promise<void>;
}

export interface PaymentGateway {
  readonly name: string;
  /** เรียกเก็บเงิน คืนเลขอ้างอิงเมื่อสำเร็จ หรือโยน Error เมื่อไม่สำเร็จ */
  charge(input: {
    amount: number;
    method: PaymentMethod;
    reference: string;
  }): Promise<{ gatewayRef: string }>;
}

const consoleSms: SmsSender = {
  async sendOtp(phone, code) {
    console.log(`[sms จำลอง] OTP ของ ${phone} คือ ${code}`);
  },
};

// ตัวจำลอง: ตอบว่าจ่ายสำเร็จทันทีโดยไม่มีเงินเคลื่อนไหวจริง
const mockGateway: PaymentGateway = {
  name: "mock",
  async charge() {
    return { gatewayRef: `mock_${randomBytes(6).toString("hex")}` };
  },
};

export const sms: SmsSender = consoleSms;
export const payments: PaymentGateway = mockGateway;

/** true เมื่อยังใช้ตัวจำลอง หน้าจอใช้แสดงป้ายเตือนว่าเป็นโหมดทดสอบ */
export const IS_MOCK_PAYMENT = payments.name === "mock";
