import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

assert.equal(process.env.APP_ENV, "staging");
assert.equal(process.env.STAGING_TEST_MODE, "true");
assert.ok(new URL(process.env.DATABASE_URL).protocol.startsWith("postgres"));
const phones = (process.env.STAGING_TEST_PHONES ?? "").split(",");
const fixtures = [
  { id: "staging-admin", phone: "0800000001", name: "ผู้ดูแลระบบ (ทดสอบ)", role: "ADMIN" },
  { id: "staging-customer", phone: "0800000002", name: "ลูกค้า (ทดสอบ)", role: "CUSTOMER" },
  { id: "staging-shop", phone: "0800000003", name: "เจ้าของร้าน (ทดสอบ)", role: "PROVIDER" },
];
assert.ok(fixtures.every((f) => phones.includes(f.phone)), "Explicitly allow all three synthetic test phones");
const db = new PrismaClient();
try {
  await db.$transaction(async (tx) => {
    for (const fixture of fixtures) {
      const existing = await tx.user.findUnique({ where: { phone: fixture.phone } });
      if (existing && existing.id !== fixture.id) throw new Error("Refusing to overwrite an existing account");
      await tx.user.upsert({ where: { id: fixture.id }, create: fixture, update: {} });
    }
    await tx.provider.upsert({ where: { id: "staging-provider" }, update: {}, create: {
      id: "staging-provider", userId: "staging-shop", name: "ร้านศาลตัวอย่าง (ทดสอบ)",
      kind: "SHOP", phone: "0800000003", areas: '["BKK","NBI","PTE","SPK"]', status: "VERIFIED",
      description: "ข้อมูลสมมติสำหรับทดสอบ ไม่มีบริการหรือการซื้อขายจริง",
    } });
    await tx.product.upsert({ where: { id: "staging-product" }, update: {}, create: {
      id: "staging-product", providerId: "staging-provider", name: "ศาลพระภูมิ (ทดสอบ)",
      description: "สินค้าสมมติสำหรับทดสอบขั้นตอนสั่งซื้อเท่านั้น", kind: "PHRA_PHUM", price: 1000,
    } });
    await tx.address.upsert({ where: { id: "staging-address" }, update: {}, create: {
      id: "staging-address", userId: "staging-customer", label: "บ้านทดสอบ", area: "BKK",
      address: "สถานที่สมมติสำหรับทดสอบระบบ กรุงเทพฯ", lat: 13.75, lng: 100.5,
    } });
  });
  console.log("Synthetic staging fixtures ready; existing orders and data were preserved");
} finally { await db.$disconnect(); }
