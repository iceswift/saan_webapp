import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { Price } from "@/components/price";
import { Reveal } from "@/components/reveal";
import { LinkButton } from "@/components/link-button";
import { EmptyState } from "@/components/visuals";
import { requireRole } from "@/server/auth";
import { listFinanceOrders } from "@/server/finance";
import { IS_MOCK_PAYMENT, payments } from "@/server/integrations";
import { formatBaht, formatDateTime } from "@/lib/format";
import { FinanceControls } from "./finance-controls";
import { RefundCaseControls } from "./refund-case-controls";
import { refundCaseTestEnabled } from "@/server/refund-case-service";
import { payoutTestEnabled } from "@/server/omise-payout-service";

export const metadata: Metadata = { title: "การเงินและรายการค้าง" };

const STATES: Record<string, string> = {
  PENDING: "รอดำเนินการ", PROCESSING: "กำลังดำเนินการ", UNKNOWN: "รอตรวจสอบผล",
  CREATED: "สร้างรายการแล้ว", SUCCEEDED: "สำเร็จ", FAILED: "ไม่สำเร็จ", NONE: "ยังไม่มีรายการ",
  PAID: "จ่ายแล้ว", REFUNDED: "คืนเงินแล้ว", NOT_REQUIRED: "ไม่มีรายการที่ต้องดำเนินการ",
  NOT_REQUESTED: "ยังไม่ส่งรายการ",
  ACTION_REQUIRED: "ต้องตรวจสอบขั้นตอนคืนเงิน ยังไม่ได้ส่งคำสั่ง",
};
const KINDS: Record<string, string> = { REFUND: "คืนเงิน", PAYOUT: "จ่ายให้ร้าน", PAYMENT_DEPOSIT: "รับมัดจำ", PAYMENT_BALANCE: "รับยอดคงเหลือ" };

export default async function AdminFinancePage() {
  const user = await requireRole("ADMIN", "/admin/finance");
  const orders = await listFinanceOrders(user);
  return (
    <AppShell width="reading">
      <PageHeader title="การเงินและรายการค้าง" backHref="/admin" />
      <LinkButton href="/admin/operations" variant="outline" size="xl" className="mb-4">ตรวจสอบตัวตรวจผลและข้อมูลสำรอง</LinkButton>
      <Notice tone="amber">
        {IS_MOCK_PAYMENT ? "โหมดทดสอบ ยังไม่มีการตัดเงินจริง คืนเงิน หรือโอนเงินให้ร้านจริง" : "ยังไม่เปิดใช้งานการคืนเงินและจ่ายให้ร้านผ่านผู้ให้บริการเงินจริง"}
      </Notice>
      <p className="mt-4 text-sm text-muted-foreground">
        แสดงสูงสุด 100 คำสั่งล่าสุดที่จบงาน ยกเลิก หรือมีรายการการเงินค้าง ยอดจ่ายให้ร้านเป็นยอดรับชำระก่อนหักค่าธรรมเนียม ยังไม่ได้กำหนดนโยบายค่าธรรมเนียม
      </p>
      <SectionTitle>รายการคำสั่งซื้อ</SectionTitle>
      {orders.length === 0 ? <EmptyState art="bell" title="ยังไม่มีรายการการเงินในคิวนี้" action={<LinkButton href="/admin" variant="outline" size="xl">กลับหน้าผู้ดูแลระบบ</LinkButton>} /> : null}
      <div className={orders.length > 0 ? "divide-y divide-border border-y border-border" : undefined}>
        {orders.map((order) => (
          <Reveal key={order.id} as="article" className="py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={`/provider/orders/${order.id}`} className="inline-flex min-h-11 items-center text-base font-medium underline underline-offset-4">{order.code}</Link>
              <Price amount={order.total} />
            </div>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["รับชำระสุทธิหลังคืนเงิน", order.paid], ["ยอดที่ต้องคืน", order.refundDue], ["คืนเงินแล้ว", order.refunded], ["ยอดรอจ่ายให้ร้าน", order.payable]].map(([label, amount]) => (
                <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="numeric mt-1 text-base">{formatBaht(Number(amount))}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">คืนเงิน: {STATES[order.refundStatus] ?? "ยังไม่มีผลยืนยัน"} · จ่ายให้ร้าน: {STATES[order.payoutStatus] ?? "ยังไม่มีผลยืนยัน"}</p>
            {order.operations.length > 0 ? (
              <details className="mt-3">
                <summary className="min-h-11 cursor-pointer py-2 text-base">ประวัติรายการ {order.operations.length} รายการ</summary>
                <ul className="divide-y divide-border">
                  {order.operations.map((operation) => (
                    <li key={operation.id} className="py-3">
                      <p className="text-base">{KINDS[operation.kind] ?? "รายการการเงิน"} · {formatBaht(operation.amountMinor / 100)} · {STATES[operation.status] ?? "รอตรวจสอบผล"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(new Date(operation.createdAt))}</p>
                      {operation.gatewayRef ? <p className="mt-1 break-all text-sm text-muted-foreground">เลขอ้างอิง {operation.gatewayRef}</p> : null}
                      {operation.status === "ACTION_REQUIRED" ? <p className="mt-1 text-sm text-muted-foreground">PromptPay ยังไม่รองรับการคืนผ่าน Omise ต้องยืนยันวิธีดำเนินการกับผู้ให้บริการก่อน เงินยังไม่ได้คืน</p> : operation.error ? <p className="mt-1 text-sm text-destructive">รายการมีข้อผิดพลาด กรุณาตรวจสอบผลก่อนดำเนินการต่อ</p> : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {order.payout?<p className="mt-3 text-sm text-muted-foreground">จ่ายร้านทดสอบ · หักค่ารับชำระ {formatBaht(order.payout.collectionFeeMinor/100)} · ยอดขอโอน {formatBaht(order.payout.requestedMinor/100)} · ค่าโอน {order.payout.transferFeeMinor===null?"รอยืนยัน":formatBaht(order.payout.transferFeeMinor/100)} · ร้านรับสุทธิ {order.payout.bankNetMinor===null?"รอยืนยัน":formatBaht(order.payout.bankNetMinor/100)}{order.payoutStatus!=="SUCCEEDED"?" (ยังไม่ยืนยันจ่ายสำเร็จ)":""}</p>:null}
            <FinanceControls order={order} gateway={payments.name} sandboxPayout={payoutTestEnabled() && order.providerId===process.env.OMISE_PAYOUT_TEST_PROVIDER_ID && payments.name==="omise_test"} />
            {refundCaseTestEnabled() ? order.operations.filter(operation => operation.kind === "REFUND" && operation.status === "ACTION_REQUIRED" && operation.gateway === "omise_test").map(operation =>
              <RefundCaseControls key={operation.id} operationId={operation.id} amountMinor={operation.amountMinor} refundCase={operation.refundCase} />,
            ) : null}
          </Reveal>
        ))}
      </div>
    </AppShell>
  );
}
