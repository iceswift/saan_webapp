import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { Reveal } from "@/components/reveal";
import { LinkButton } from "@/components/link-button";
import { EmptyState } from "@/components/visuals";
import { formatBaht } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { listFinanceOrders } from "@/server/finance";
import { IS_MOCK_PAYMENT } from "@/server/integrations";
import { getMyProvider } from "@/server/queries";

export const metadata: Metadata = { title: "การเงินร้าน" };

export default async function ProviderFinancePage() {
  const user = await requireUser("/provider/finance");
  const provider = await getMyProvider(user.id);
  if (!provider) redirect("/provider");
  const orders = await listFinanceOrders(user, provider.id);
  const paid = orders.reduce((sum, order) => sum + order.operations.filter((operation) => operation.kind === "PAYOUT" && operation.status === "SUCCEEDED").reduce((amount, operation) => amount + (order.payout?.bankNetMinor ?? operation.amountMinor) / 100, 0), 0);
  const payable = orders.filter((order) => order.status === "COMPLETED").reduce((sum, order) => sum + order.payable, 0);
  return (
    <AppShell width="reading">
      <PageHeader title="การเงินร้าน" backHref="/provider" />
      <Notice tone="amber">
        {IS_MOCK_PAYMENT ? "โหมดทดสอบ ยังไม่มีการโอนเงินจริงให้ร้าน ยอดทั้งหมดใช้ทดสอบระบบเท่านั้น" : "ยังไม่เปิดใช้งานการจ่ายให้ร้านผ่านผู้ให้บริการเงินจริง"}
      </Notice>
      <dl className="mt-6 grid grid-cols-2 gap-6 border-y border-border py-5">
        <div><dt className="text-sm text-muted-foreground">ยอดรอจ่ายจากงานที่ตรวจรับแล้ว</dt><dd className="numeric mt-2 font-display text-2xl font-normal">{formatBaht(payable)}</dd></div>
        <div><dt className="text-sm text-muted-foreground">ยอดจ่ายสำเร็จในรายการที่แสดง</dt><dd className="numeric mt-2 font-display text-2xl font-normal">{formatBaht(paid)}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">แสดงสูงสุด 100 คำสั่งล่าสุด ยอดรับชำระแสดงก่อนหักค่าใช้จ่าย ยอดจ่ายสำเร็จของ Omise แสดงสุทธิหลังหักค่าใช้จ่ายตามรายการทดสอบ ยังไม่ได้กำหนดนโยบายค่าธรรมเนียมสำหรับเงินจริง</p>
      <SectionTitle>รายการคำสั่งซื้อ</SectionTitle>
      {orders.length === 0 ? <EmptyState art="bell" title="ยังไม่มีรายการการเงินของร้าน" action={<LinkButton href="/provider" variant="outline" size="xl">กลับไปดูงานของร้าน</LinkButton>} /> : null}
      <div className={orders.length > 0 ? "divide-y divide-border border-y border-border" : undefined}>
        {orders.map((order) => (
          <Reveal key={order.id} as="article" className="py-5">
            <Link href={`/provider/orders/${order.id}`} className="inline-flex min-h-11 items-center text-base font-medium underline underline-offset-4">{order.code}</Link>
            <dl className="mt-2 grid gap-3 sm:grid-cols-3">
              {[["รับชำระสุทธิหลังคืนเงิน", order.paid], ["คืนให้ลูกค้าแล้ว", order.refunded], ["ยอดรอจ่ายให้ร้าน", order.payable]].map(([label, amount]) => (
                <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="numeric mt-1 text-base">{formatBaht(Number(amount))}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">{order.payoutStatus === "SUCCEEDED" ? "จ่ายให้ร้านสำเร็จ" : order.payoutStatus === "FAILED" ? "จ่ายให้ร้านไม่สำเร็จ ทีมงานต้องตรวจสอบ" : ["PROCESSING", "PENDING", "UNKNOWN"].includes(order.payoutStatus) ? "รายการจ่ายให้ร้านรอตรวจสอบผล" : order.status === "COMPLETED" ? "รอดำเนินการจ่ายให้ร้าน" : "ยังไม่มียอดจ่ายให้ร้าน"}</p>
            {order.payout?<p className="mt-2 text-sm text-muted-foreground">รายการ Omise ทดสอบ · ค่ารับชำระ {formatBaht(order.payout.collectionFeeMinor/100)} · ค่าโอน {order.payout.transferFeeMinor===null?"รอยืนยัน":formatBaht(order.payout.transferFeeMinor/100)} · ยอดสุทธิ {order.payout.bankNetMinor===null?"รอยืนยัน":formatBaht(order.payout.bankNetMinor/100)} · ไม่มีการโอนเงินจริง</p>:null}
          </Reveal>
        ))}
      </div>
    </AppShell>
  );
}
