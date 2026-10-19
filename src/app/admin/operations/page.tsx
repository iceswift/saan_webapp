import type { Metadata } from "next";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { LinkButton } from "@/components/link-button";
import { Notice } from "@/components/notice";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { healthState, readHealth } from "@/server/operations-health";
import { formatDateTime, formatBaht } from "@/lib/format";

export const metadata: Metadata = { title: "ตรวจสอบระบบการเงิน" };
const labels = { good: "ทำงานปกติ", missing: "ยังไม่มีข้อมูลยืนยัน", stale: "ข้อมูลเก่า ต้องตรวจสอบ", failed: "ตรวจพบข้อผิดพลาด" };
const kinds: Record<string,string> = { PAYOUT: "จ่ายร้าน", REFUND: "คืนเงิน", PAYMENT_DEPOSIT: "รับมัดจำ", PAYMENT_BALANCE: "รับยอดคงเหลือ" };
async function snapshot() {
  return Promise.all([
    readHealth("worker"), readHealth("backup"),
    db.moneyOperation.count({ where: { status: { in: ["UNKNOWN", "ACTION_REQUIRED"] } } }),
    db.moneyOperation.findMany({ where: { OR: [
      { status: { in: ["UNKNOWN", "ACTION_REQUIRED"] } },
      { status: { in: ["PENDING", "PROCESSING"] }, createdAt: { lt: new Date(Date.now() - 30 * 60_000) } },
    ] }, orderBy: { createdAt: "asc" }, take: 50, include: { order: { select: { code: true } } } }),
  ]);
}
export default async function OperationsPage() {
  await requireRole("ADMIN", "/admin/operations");
  const [worker, backup, count, operations] = await snapshot();
  return <AppShell width="reading">
    <PageHeader title="ตรวจสอบระบบการเงิน" backHref="/admin/finance" />
    <ListGroup label="สถานะระบบ">
      <ListRow title={`ตัวตรวจผลชำระเงิน · ${process.env.PAYMENT_RECONCILIATION_ENABLED === "true" ? labels[healthState(worker, 5 * 60_000)] : "ยังไม่เปิดใช้งาน"}`} meta={worker ? `ตรวจล่าสุด ${formatDateTime(new Date(worker.checkedAt))}` : "ยังยืนยันการทำงานของตัวตรวจผลไม่ได้"} />
      <ListRow title={`สำรองข้อมูล · ${labels[healthState(backup, 30 * 60 * 60_000)]}`} meta={backup?.lastSuccessAt ? `สำเร็จล่าสุด ${formatDateTime(new Date(backup.lastSuccessAt))}` : "ยังไม่มีผลสำรองข้อมูลที่ยืนยันสำเร็จ"} />
    </ListGroup>
    <p className="mt-4 text-sm text-muted-foreground">สถานะ ณ เวลาเปิดหน้า โหลดหน้าใหม่เพื่อดูข้อมูลล่าสุด ตัวตรวจผลเงียบเกิน 5 นาทีหรือสำรองข้อมูลเกิน 30 ชั่วโมงจะแสดงให้ตรวจสอบ</p>
    <SectionTitle>รายการที่ต้องตรวจสอบ {count > 0 ? `(${count} รายการรอตรวจผลหรือดำเนินการ)` : ""}</SectionTitle>
    <Notice tone="amber">รายการรอตรวจผลต้องค้นหารายการเดิมก่อน ห้ามส่งรับชำระหรือโอนซ้ำ รายการคืนเงินที่ต้องดำเนินการยังไม่ถือว่าคืนสำเร็จ</Notice>
    <div className="mt-4"><ListGroup label="รายการเงินที่ต้องตรวจสอบ">
      {operations.length ? operations.map(op => <ListRow key={op.id} href="/admin/finance" title={`${op.order.code} · ${kinds[op.kind] ?? "รายการเงิน"} · ${formatBaht(op.amountMinor / 100)}`} meta={`${op.status === "ACTION_REQUIRED" ? "ต้องดำเนินการ" : op.status === "UNKNOWN" ? "ยังยืนยันผลไม่ได้" : "รอผลเกิน 30 นาที"} · เริ่ม ${formatDateTime(op.createdAt)}`} />) : <ListRow title="ไม่มีรายการที่เข้าเงื่อนไขต้องตรวจสอบ" />}
    </ListGroup></div>
    <p className="mt-4 text-sm text-muted-foreground">แสดงสูงสุด 50 รายการเก่าสุด การแจ้งเตือนแสดงในหน้านี้ ยังไม่มีการส่งข้อความออกภายนอก สำรองข้อมูลยังอยู่บนเครื่องเดียวกับระบบ</p>
    <LinkButton className="mt-6" href="/admin/finance" variant="outline" size="xl">ดูรายการการเงิน</LinkButton>
  </AppShell>;
}
