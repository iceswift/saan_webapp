// ข้อมูลทดสอบสำหรับพัฒนาในเครื่อง ไม่ใช่ร้านหรือราคาจริง
// รัน: npm run db:seed (ลบข้อมูลเดิมทั้งหมดก่อนใส่ใหม่)

import { PrismaClient } from "@prisma/client";
import { seedDemo } from "./seed-demo";

const db = new PrismaClient();

async function main() {
  await db.notification.deleteMany();
  await db.orderMessage.deleteMany();
  await db.careLog.deleteMany();
  await db.address.deleteMany();
  await db.review.deleteMany();
  await db.payment.deleteMany();
  await db.orderEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.quote.deleteMany();
  await db.serviceRequest.deleteMany();
  await db.vow.deleteMany();
  await db.shrine.deleteMany();
  await db.servicePackage.deleteMany();
  await db.product.deleteMany();
  await db.provider.deleteMany();
  await db.session.deleteMany();
  await db.otpCode.deleteMany();
  await db.user.deleteMany();

  await db.user.create({ data: { phone: "0800000001", name: "ผู้ดูแลระบบ (ทดสอบ)", role: "ADMIN" } });
  await db.user.create({ data: { phone: "0800000002", name: "ลูกค้า (ทดสอบ)" } });

  const shopUser = await db.user.create({
    data: { phone: "0800000003", name: "เจ้าของร้าน (ทดสอบ)", role: "PROVIDER" },
  });
  const shop = await db.provider.create({
    data: {
      userId: shopUser.id,
      name: "ร้านศาลตัวอย่าง ก (ข้อมูลทดสอบ)",
      kind: "SHOP",
      description: "ร้านตัวอย่างสำหรับทดสอบระบบ รับตั้งศาล ถอนศาล และซ่อมศาลครบวงจร",
      phone: "0800000003",
      areas: JSON.stringify(["BKK", "NBI", "PTE", "SPK"]),
      status: "VERIFIED",
    },
  });

  await db.product.createMany({
    data: [
      {
        providerId: shop.id,
        name: "ศาลพระภูมิเสามังกร",
        description: "พร้อมโต๊ะหน้าศาล 2 ตัว เลือกสีได้",
        kind: "PHRA_PHUM",
        price: 10900,
      },
      {
        providerId: shop.id,
        name: "ชุดศาลพระภูมิและศาลเจ้าที่ ขนาดกลาง",
        description: "ศาลพระภูมิและศาลเจ้าที่ พร้อมโต๊ะหน้าศาล 2 ตัว",
        kind: "PAIR",
        price: 17900,
      },
      {
        providerId: shop.id,
        name: "ศาลเจ้าที่ทรงไทย",
        description: "ศาลตายายทรงเรือนไทย สำหรับบ้านพักอาศัย",
        kind: "CHAO_THI",
        price: 6500,
      },
    ],
  });

  await db.servicePackage.createMany({
    data: [
      {
        providerId: shop.id,
        type: "CEREMONY",
        name: "พิธีตั้งศาลโดยพราหมณ์",
        description: "รวมดูฤกษ์และค่าเดินทางในพื้นที่บริการ",
        price: 3500,
      },
      {
        providerId: shop.id,
        type: "OFFERINGS",
        name: "เครื่องสังเวยและของถวายครบชุด",
        description: "บายศรี ผลไม้ ขนม ดอกไม้ ธูปเทียน จัดเตรียมถึงหน้างาน",
        price: 7000,
      },
      {
        providerId: shop.id,
        type: "BASE",
        name: "ทำฐานศาลคอนกรีต",
        description: "ฐานขนาดมาตรฐาน รวมวัสดุและค่าแรง",
        price: 2500,
      },
    ],
  });

  const shopBUser = await db.user.create({
    data: { phone: "0800000005", name: "เจ้าของร้าน ค (ทดสอบ)", role: "PROVIDER" },
  });
  const shopB = await db.provider.create({
    data: {
      userId: shopBUser.id,
      name: "โรงงานศาลตัวอย่าง ค (ข้อมูลทดสอบ)",
      kind: "SHOP",
      description: "โรงงานตัวอย่างสำหรับทดสอบระบบ ผลิตศาลทรงโมเดิร์นและศาลพระพรหม",
      phone: "0800000005",
      areas: JSON.stringify(["BKK", "NBI"]),
      status: "VERIFIED",
    },
  });
  await db.product.createMany({
    data: [
      {
        providerId: shopB.id,
        name: "ศาลโมเดิร์นหินขัดสีขาว",
        description: "ทรงเรียบ เข้ากับบ้านสมัยใหม่ พร้อมฐานในตัว",
        kind: "MODERN",
        price: 24900,
      },
      {
        providerId: shopB.id,
        name: "ศาลพระพรหมขนาดมาตรฐาน",
        description: "สำหรับสำนักงานและสถานประกอบการ",
        kind: "PHRA_PHROM",
        price: 38500,
      },
      {
        providerId: shopB.id,
        name: "ศาลพระภูมิโมเดิร์นสีเทา",
        description: "เสาเดี่ยว ทรงร่วมสมัย",
        kind: "PHRA_PHUM",
        price: 15900,
      },
    ],
  });
  await db.servicePackage.createMany({
    data: [
      {
        providerId: shopB.id,
        type: "CEREMONY",
        name: "พิธีตั้งศาลโดยพราหมณ์",
        description: "รวมดูฤกษ์ ไม่รวมเครื่องสังเวย",
        price: 4500,
      },
      {
        providerId: shopB.id,
        type: "REMOVE_OLD",
        name: "ถอนและรับศาลเก่า",
        description: "พิธีถอน ขนย้าย และนำศาลเก่าไปส่งวัดที่รับ",
        price: 3000,
      },
    ],
  });

  const shop2User = await db.user.create({
    data: { phone: "0800000004", name: "ช่างซ่อม (ทดสอบ)", role: "PROVIDER" },
  });
  await db.provider.create({
    data: {
      userId: shop2User.id,
      name: "ช่างซ่อมศาลตัวอย่าง ข (ข้อมูลทดสอบ)",
      kind: "TECHNICIAN",
      description: "บัญชีตัวอย่างที่ยังรอผู้ดูแลระบบตรวจสอบ",
      phone: "0800000004",
      areas: JSON.stringify(["BKK"]),
      status: "PENDING",
    },
  });

  await seedDemo(db);

  console.log("ใส่ข้อมูลทดสอบเรียบร้อย");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
