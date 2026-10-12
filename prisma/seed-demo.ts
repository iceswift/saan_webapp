// ข้อมูลทดสอบชุดเสริม: สร้างคำสั่งซื้อครบทุกสถานะ คำขอใบเสนอราคา ศาล สมุดบน และการแจ้งเตือน
// เพื่อให้เปิดดูทุกหน้าจอได้ทันทีหลัง seed ไม่ใช่ข้อมูลจริง

import type { PrismaClient } from "@prisma/client";

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

export async function seedDemo(db: PrismaClient) {
  const customer = await db.user.findUniqueOrThrow({ where: { phone: "0800000002" } });
  const shopUser = await db.user.findUniqueOrThrow({ where: { phone: "0800000003" } });
  const shop = await db.provider.findUniqueOrThrow({ where: { userId: shopUser.id } });
  const products = await db.product.findMany({ where: { providerId: shop.id }, orderBy: { price: "asc" } });
  const packages = await db.servicePackage.findMany({ where: { providerId: shop.id }, orderBy: { price: "asc" } });
  const ceremony = packages.find((p) => p.type === "CEREMONY")!;
  const offerings = packages.find((p) => p.type === "OFFERINGS")!;
  const address = "99/1 ซอยทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพมหานคร";

  await db.address.create({
    data: { userId: customer.id, label: "บ้าน", area: "BKK", address, lat: 13.7563, lng: 100.5018, isDefault: true },
  });

  // ร้านตัวอย่างไม่ว่างสามวัน เพื่อทดสอบปฏิทินวันว่าง
  const dayKey = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(daysFromNow(n));
  await db.providerBlockedDate.createMany({
    data: [12, 13, 14].map((n) => ({ providerId: shop.id, date: dayKey(n), note: "ร้านปิดรับงาน" })),
  });

  const shrine = await db.shrine.create({
    data: {
      userId: customer.id,
      name: "ศาลพระภูมิหน้าบ้าน",
      kind: "PHRA_PHUM",
      area: "BKK",
      address,
      installedAt: daysFromNow(-400),
      careLogs: {
        create: [
          { title: "เปลี่ยนพวงมาลัย", doneAt: daysFromNow(-3) },
          { title: "ทำความสะอาด", note: "เช็ดฝุ่นและล้างฐานศาล", doneAt: daysFromNow(-20) },
        ],
      },
    },
  });

  await db.vow.createMany({
    data: [
      {
        userId: customer.id,
        place: "ศาลพระภูมิหน้าบ้าน",
        wish: "ขอให้งานใหม่ราบรื่น",
        promise: "พวงมาลัยดาวเรือง 9 พวง",
        status: "WAITING",
        remindAt: daysFromNow(14),
      },
      {
        userId: customer.id,
        place: "ศาลท้าวมหาพรหม เอราวัณ",
        wish: "ขอให้สอบผ่าน",
        promise: "ละครรำ 4 คน",
        status: "GRANTED",
      },
      {
        userId: customer.id,
        place: "ศาลหลักเมือง",
        wish: "ขอให้เดินทางปลอดภัย",
        promise: "ผลไม้ 5 อย่าง",
        status: "FULFILLED",
      },
    ],
  });

  let seq = 100001;
  async function order(input: {
    status: string;
    productIndex: number;
    withCeremony?: boolean;
    withOfferings?: boolean;
    scheduledAt?: Date;
    createdDaysAgo: number;
    shrineId?: string;
  }) {
    const product = products[input.productIndex];
    const items = [{ name: product.name, price: product.price, productId: product.id }] as {
      name: string;
      price: number;
      productId?: string;
      packageId?: string;
    }[];
    if (input.withCeremony) items.push({ name: ceremony.name, price: ceremony.price, packageId: ceremony.id });
    if (input.withOfferings) items.push({ name: offerings.name, price: offerings.price, packageId: offerings.id });
    const total = items.reduce((sum, i) => sum + i.price, 0);
    const deposit = Math.round(total * 0.3);
    const createdAt = daysFromNow(-input.createdDaysAgo);
    const paidDeposit = input.status !== "AWAITING_DEPOSIT";
    const completed = input.status === "COMPLETED";

    return db.order.create({
      data: {
        code: `SN-${seq++}`,
        userId: customer.id,
        providerId: shop.id,
        shrineId: input.shrineId ?? null,
        type: "INSTALL",
        status: input.status,
        shrineKind: product.kind,
        placeType: "HOME",
        area: "BKK",
        address,
        preferredDates: JSON.stringify(["2026-11-07", "2026-11-14"]),
        scheduledAt: input.scheduledAt ?? null,
        total,
        deposit,
        createdAt,
        items: { create: items },
        events: {
          create: [
            { title: "สร้างคำสั่งซื้อ", byRole: "CUSTOMER", createdAt },
            ...(paidDeposit
              ? [{ title: "จ่ายมัดจำแล้ว", note: `ได้รับมัดจำ ฿${deposit.toLocaleString("en-US")}`, byRole: "CUSTOMER", createdAt }]
              : []),
          ],
        },
        payments: {
          create: [
            ...(paidDeposit
              ? [{ kind: "DEPOSIT", amount: deposit, method: "PROMPTPAY", status: "PAID", gateway: "mock", paidAt: createdAt }]
              : []),
            ...(completed
              ? [{ kind: "BALANCE", amount: total - deposit, method: "PROMPTPAY", status: "PAID", gateway: "mock", paidAt: daysFromNow(-30) }]
              : []),
          ],
        },
      },
    });
  }

  await order({ status: "AWAITING_DEPOSIT", productIndex: 0, withCeremony: true, createdDaysAgo: 0 });
  await order({ status: "AWAITING_PROVIDER", productIndex: 1, withCeremony: true, withOfferings: true, createdDaysAgo: 1 });

  const confirmed = await order({
    status: "CONFIRMED",
    productIndex: 2,
    withCeremony: true,
    withOfferings: true,
    scheduledAt: daysFromNow(9),
    createdDaysAgo: 4,
  });
  await db.orderEvent.createMany({
    data: [
      { orderId: confirmed.id, title: "ร้านยืนยันคำสั่ง", note: "นัดหมายตามวันที่ลูกค้าสะดวก", byRole: "PROVIDER", createdAt: daysFromNow(-3) },
      { orderId: confirmed.id, title: "เตรียมศาลและฐานเรียบร้อย", note: "พร้อมจัดส่งตามวันนัด", byRole: "PROVIDER", createdAt: daysFromNow(-1) },
    ],
  });
  await db.orderMessage.createMany({
    data: [
      { orderId: confirmed.id, senderId: customer.id, body: "ขอถามว่าวันงานต้องเตรียมอะไรเพิ่มไหมครับ", createdAt: daysFromNow(-2) },
      { orderId: confirmed.id, senderId: shopUser.id, body: "ไม่ต้องเตรียมเพิ่มครับ ทางร้านจัดเครื่องสังเวยไปให้ครบ ขอแค่ที่จอดรถหน้าบ้านครับ", createdAt: daysFromNow(-2) },
    ],
  });

  const done = await order({
    status: "DONE",
    productIndex: 0,
    withCeremony: true,
    scheduledAt: daysFromNow(-1),
    createdDaysAgo: 12,
  });
  await db.orderEvent.createMany({
    data: [
      { orderId: done.id, title: "ร้านยืนยันคำสั่ง", byRole: "PROVIDER", createdAt: daysFromNow(-10) },
      { orderId: done.id, title: "ร้านแจ้งว่างานเสร็จ", note: "รอลูกค้าตรวจรับงาน", byRole: "PROVIDER", createdAt: daysFromNow(-1) },
    ],
  });

  const completed = await order({
    status: "COMPLETED",
    productIndex: 0,
    withCeremony: true,
    withOfferings: true,
    scheduledAt: daysFromNow(-400),
    createdDaysAgo: 410,
    shrineId: shrine.id,
  });
  await db.orderEvent.createMany({
    data: [
      { orderId: completed.id, title: "ร้านยืนยันคำสั่ง", byRole: "PROVIDER", createdAt: daysFromNow(-408) },
      { orderId: completed.id, title: "ร้านแจ้งว่างานเสร็จ", byRole: "PROVIDER", createdAt: daysFromNow(-400) },
      { orderId: completed.id, title: "ลูกค้าตรวจรับงานแล้ว", byRole: "CUSTOMER", createdAt: daysFromNow(-399) },
    ],
  });
  await db.review.create({
    data: {
      orderId: completed.id,
      userId: customer.id,
      providerId: shop.id,
      rating: 5,
      comment: "รีวิวทดสอบ: งานเรียบร้อย มาตรงเวลา",
      createdAt: daysFromNow(-399),
    },
  });

  const cancelled = await order({ status: "CANCELLED", productIndex: 1, createdDaysAgo: 6 });
  await db.orderEvent.create({
    data: { orderId: cancelled.id, title: "ลูกค้ายกเลิกคำสั่ง", note: "ต้องคืนมัดจำให้ลูกค้า", byRole: "CUSTOMER", createdAt: daysFromNow(-5) },
  });

  const quoted = await db.serviceRequest.create({
    data: {
      userId: customer.id,
      shrineId: shrine.id,
      type: "REPAIR",
      description: "หลังคาศาลแตกร้าวและสีลอก ต้องการซ่อมและทาสีใหม่ทั้งหลัง",
      area: "BKK",
      address,
      createdAt: daysFromNow(-2),
    },
  });
  await db.quote.create({
    data: {
      requestId: quoted.id,
      providerId: shop.id,
      price: 2800,
      note: "รวมค่าแรง ค่าสี และค่าเดินทาง ใช้เวลาประมาณครึ่งวัน",
      createdAt: daysFromNow(-1),
    },
  });
  await db.serviceRequest.create({
    data: {
      userId: customer.id,
      type: "REMOVE",
      description: "ต้องการถอนศาลเก่าและนำไปส่งวัด เพราะจะต่อเติมบ้าน",
      area: "BKK",
      address,
      createdAt: daysFromNow(0),
    },
  });

  await db.notification.createMany({
    data: [
      { userId: customer.id, kind: "ORDER", title: "ร้านแจ้งว่างานเสร็จ", body: "กรุณาตรวจงานและยืนยันรับงาน", href: `/orders/${done.id}`, createdAt: daysFromNow(-1) },
      { userId: customer.id, kind: "QUOTE", title: "มีใบเสนอราคาใหม่", body: `${shop.name} เสนอราคา ฿2,800`, href: `/requests/${quoted.id}`, createdAt: daysFromNow(-1) },
      { userId: customer.id, kind: "ORDER", title: "ร้านยืนยันคำสั่งแล้ว", body: "ดูวันและเวลานัดได้ในคำสั่งซื้อ", href: `/orders/${confirmed.id}`, readAt: daysFromNow(-2), createdAt: daysFromNow(-3) },
      { userId: shopUser.id, kind: "ORDER", title: "มีคำสั่งใหม่รอคุณยืนยัน", body: "ลูกค้าจ่ายมัดจำแล้ว", href: "/provider?tab=orders", createdAt: daysFromNow(-1) },
    ],
  });
}
