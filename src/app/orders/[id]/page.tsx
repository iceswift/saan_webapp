import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { TwoColumn, SidePanel } from "@/components/page-layout";
import { Rise } from "@/components/rise";
import { StatusLine } from "@/components/status-line";
import type { OrderDetail } from "@/lib/types";
import { requireUser } from "@/server/auth";
import { IS_MOCK_PAYMENT } from "@/server/integrations";
import { getOrder } from "@/server/queries";
import { ORDER_FLOW_STEPS, orderStepIndex } from "../display";
import {
  CancelOrderControl,
  CompleteOrderPanel,
  OrderCelebrate,
  PayDepositPanel,
  ReviewForm,
} from "./order-actions";
import { OrderChat } from "./order-chat";
import {
  MoneyRows,
  OrderDetails,
  OrderItems,
  OrderPayments,
  OrderTimeline,
  ReviewView,
  ShopContact,
} from "./order-sections";

export const metadata: Metadata = { title: "รายละเอียดคำสั่ง" };

const QUICK_REPLIES = ["สอบถามรายละเอียดเพิ่มเติม", "ขอเลื่อนวันนัด", "ขอบคุณค่ะ/ครับ"];

const whenFmt = new Intl.DateTimeFormat("th-TH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

/** "อา. 18 ต.ค. 06:41 น." */
function whenText(iso: string): string {
  const parts = whenFmt.formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")} ${pick("hour")}:${pick("minute")} น.`;
}

const STEP_LABELS = [...ORDER_FLOW_STEPS.map((s) => s.label)];

/** ประโยคสถานะเดียวของคำสั่ง (ที่มาเดียวของข้อความสถานะในหน้านี้) */
function describe(order: OrderDetail): {
  title: string;
  detail?: string;
  tone: "wait" | "info" | "good" | "bad";
} {
  const shop = order.provider.name;
  switch (order.status) {
    case "AWAITING_DEPOSIT":
      return { title: "รอจ่ายมัดจำเพื่อให้ร้านรับงาน", detail: shop, tone: "wait" };
    case "AWAITING_PROVIDER":
      return { title: "รอร้านยืนยันและนัดวัน", detail: `จ่ายมัดจำแล้ว · ${shop}`, tone: "wait" };
    case "CONFIRMED":
      return {
        title: order.scheduledAt ? `ร้านนัดเข้างาน ${whenText(order.scheduledAt)}` : "ร้านยืนยันแล้ว",
        detail: order.scheduledAt ? shop : `${shop} จะแจ้งวันและเวลาอีกครั้ง`,
        tone: "info",
      };
    case "DONE":
      return { title: "ร้านทำงานเสร็จแล้ว รอคุณตรวจรับ", detail: shop, tone: "wait" };
    case "COMPLETED":
      return { title: "งานเสร็จสมบูรณ์", detail: `ขอบคุณที่ใช้บริการ ${shop}`, tone: "good" };
    case "CANCELLED": {
      const refunded = order.payments.some((p) => p.status === "REFUNDED");
      const depositPaid = order.payments.some((p) => p.kind === "DEPOSIT" && p.status === "PAID");
      return {
        title: "คำสั่งนี้ถูกยกเลิก",
        detail: refunded
          ? "คืนมัดจำเรียบร้อยแล้ว"
          : depositPaid
            ? "ทีมงานจะติดต่อเพื่อคืนมัดจำ"
            : "ดูเบอร์ติดต่อร้านได้ในรายละเอียด",
        tone: "bad",
      };
    }
  }
}

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  const order = await getOrder(id, user);
  if (!order) notFound();
  if (order.viewerIs !== "CUSTOMER") redirect(`/provider/orders/${id}`);

  const stepIndex = orderStepIndex(order.status);
  const status = describe(order);
  const hasAction =
    order.status === "AWAITING_DEPOSIT" ||
    order.status === "DONE" ||
    (order.status === "COMPLETED" && order.review === null);

  return (
    <AppShell width="full">
      <OrderCelebrate />
      <PageHeader eyebrow={`เลขที่ ${order.code}`} title={order.title} backHref="/orders" backLabel="งานของฉัน" />

      {/* เดสก์ท็อป: การกระทำถัดไปอยู่ในแผงขวาที่ติดค้าง (ยอดเงิน ปุ่ม ร้าน) มือถือ: อยู่ใต้บรรทัดสถานะ */}
      <TwoColumn
        asideOn="hide"
        aside={
          <SidePanel>
            <div className="flex flex-col gap-5">
              <NextAction order={order} />
              {order.status !== "AWAITING_DEPOSIT" && order.status !== "DONE" ? (
                <MoneyRows order={order} withTotal />
              ) : null}
              <div className="border-t border-border pt-4">
                <ShopContact order={order} />
              </div>
            </div>
          </SidePanel>
        }
      >
        <Rise>
          <StatusLine
            title={status.title}
            detail={status.detail}
            tone={status.tone}
            steps={stepIndex === null ? undefined : STEP_LABELS}
            step={stepIndex ?? undefined}
          />
        </Rise>

        {hasAction || order.status === "AWAITING_PROVIDER" ? (
          <div className="mt-6 lg:hidden">
            <NextAction order={order} />
          </div>
        ) : null}

        {order.review ? (
          <section>
            <SectionTitle>รีวิวของคุณ</SectionTitle>
            <ReviewView review={order.review} />
          </section>
        ) : null}

        <OrderItems order={order} />

        <OrderChat
          orderId={order.id}
          messages={order.messages}
          disabled={order.status === "CANCELLED"}
          counterpartLabel="ร้าน"
          quickReplies={QUICK_REPLIES}
        />

        <OrderTimeline events={order.events} />
        <OrderDetails order={order} />
        <OrderPayments payments={order.payments} />
      </TwoColumn>
    </AppShell>
  );
}

/** สิ่งที่ลูกค้าทำได้ต่อไป ตามสถานะ (ไม่มีข้อความสถานะซ้ำ: อยู่ใน StatusLine แล้ว) */
function NextAction({ order }: { order: OrderDetail }) {
  switch (order.status) {
    case "AWAITING_DEPOSIT":
      return (
        <div className="flex flex-col gap-3">
          <PayDepositPanel orderId={order.id} amount={order.deposit} isMock={IS_MOCK_PAYMENT} />
          <CancelOrderControl orderId={order.id} hasDeposit={false} />
        </div>
      );
    case "AWAITING_PROVIDER":
      return <CancelOrderControl orderId={order.id} hasDeposit />;
    case "DONE":
      return <CompleteOrderPanel orderId={order.id} balance={order.balance} isMock={IS_MOCK_PAYMENT} />;
    case "COMPLETED":
      return order.review === null ? <ReviewForm orderId={order.id} /> : null;
    default:
      return null;
  }
}
