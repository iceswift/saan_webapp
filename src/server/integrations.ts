import "server-only";
import { mockGateway, unconfiguredGateway, type PaymentGateway } from "./payment-gateway";
import { durableMockGateway } from "./durable-mock-gateway";
import { isStagingTestMode, shouldUseMockPayments, shouldUseOmiseTestPayments } from "./runtime-policy";
import { omiseTestGateway } from "./omise-test-gateway";
export type { PaymentGateway } from "./payment-gateway";

// จุดเชื่อมต่อบริการภายนอก ตอนนี้เป็นตัวจำลองทั้งหมด
// เมื่อมีบัญชีผู้ให้บริการจริง ให้เขียนตัวจริงตาม interface เดิมแล้วสลับที่ท้ายไฟล์

export interface SmsSender {
  sendOtp(phone: string, code: string): Promise<void>;
}

const consoleSms: SmsSender = {
  async sendOtp(phone, code) {
    if (process.env.NODE_ENV !== "production") console.log(`[sms จำลอง] OTP ของ ${phone} คือ ${code}`);
  },
};

export const sms: SmsSender = consoleSms;
export const payments: PaymentGateway = shouldUseOmiseTestPayments() ? omiseTestGateway : shouldUseMockPayments()
  ? (isStagingTestMode() ? durableMockGateway : mockGateway) : unconfiguredGateway;

/** true เมื่อยังใช้ตัวจำลอง หน้าจอใช้แสดงป้ายเตือนว่าเป็นโหมดทดสอบ */
export const IS_MOCK_PAYMENT = payments.name === "mock" || payments.name === "omise_test";
export const IS_OMISE_TEST_PAYMENT = payments.name === "omise_test";
