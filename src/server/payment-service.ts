import "server-only";
import type { MoneyOperation, Prisma } from "@prisma/client";
import type { PaymentMethod } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import { fail, ok, type ActionResult } from "@/lib/result";
import { addEvent, notify, NOT_ALLOWED } from "./action-utils";
import { db } from "./db";
import { payments } from "./integrations";
import type { PaymentGateway } from "./payment-gateway";

type CustomerPaymentKind = "PAYMENT_DEPOSIT" | "PAYMENT_BALANCE";
type PaymentInput = { orderId: string; userId: string; method: PaymentMethod; kind: CustomerPaymentKind };
const orderInclude = { items: true, payments: true, provider: true } as const;
type PaymentOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const PAYMENT_IN_PROGRESS = "รายการชำระเงินกำลังตรวจสอบ กรุณารอสักครู่หรือติดต่อทีมงาน";
const PAYMENT_FAILED = "รายการชำระเงินไม่สำเร็จ กรุณาติดต่อทีมงานเพื่อตรวจสอบก่อนทำรายการใหม่";

/** Existing Payment rows are still authoritative for legacy orders. */
function paidAmount(order: PaymentOrder) {
  return order.payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0);
}

async function finishOrder(tx: Prisma.TransactionClient, order: PaymentOrder, amount: number) {
  let shrineId = order.shrineId;
  if (order.type === "INSTALL" && !shrineId) {
    const shrine = await tx.shrine.create({
      data: {
        userId: order.userId,
        name: order.items[0]?.name ?? "ศาลของฉัน",
        kind: order.shrineKind || "PHRA_PHUM",
        area: order.area,
        address: order.address,
        lat: order.lat,
        lng: order.lng,
        installedAt: order.scheduledAt ?? new Date(),
      },
    });
    shrineId = shrine.id;
  }
  await tx.order.update({ where: { id: order.id }, data: { status: "COMPLETED", shrineId } });
  await addEvent(tx, order.id, "ลูกค้าตรวจรับงานแล้ว", "CUSTOMER", {
    note: amount > 0 ? `จ่ายส่วนที่เหลือ ${formatBaht(amount)}` : "",
  });
  await notify(tx, order.provider.userId, "ORDER", "ลูกค้าตรวจรับงานแล้ว", {
    body: `เลขที่ ${order.code} เสร็จสมบูรณ์`,
    href: `/provider/orders/${order.id}`,
  });
}

/**
 * Reserve before contacting the gateway. No network call runs while a DB lock is held.
 * FAILED is final here; PENDING/UNKNOWN/abandoned PROCESSING require explicit
 * reconciliation using gateway.retrieve, never another automatic charge.
 */
export async function runCustomerPayment(input: PaymentInput, gateway: PaymentGateway = payments): Promise<ActionResult> {
  const expected = input.kind === "PAYMENT_DEPOSIT" ? "AWAITING_DEPOSIT" : "DONE";
  const paymentKind = input.kind === "PAYMENT_DEPOSIT" ? "DEPOSIT" : "BALANCE";
  const key = `${input.orderId}:${paymentKind}`;
  let reservation;
  try {
    reservation = await db.$transaction(async (tx) => {
      // A write first serializes payment versus cancellation on this order.
      const locked = await tx.order.updateMany({
        where: { id: input.orderId, userId: input.userId, status: expected },
        data: { status: expected },
      });
      const order = await tx.order.findUnique({ where: { id: input.orderId }, include: orderInclude });
      if (!order || order.userId !== input.userId) return { result: NOT_ALLOWED };
      if (order.status === "CANCELLED") return { result: fail("คำสั่งนี้ถูกยกเลิกแล้ว ไม่สามารถชำระเงินได้") };
      const existing = await tx.moneyOperation.findUnique({ where: { key } });
      if (existing?.status === "SUCCEEDED") return { result: ok() };
      // A repeated request must also work for orders paid before the ledger existed.
      if (input.kind === "PAYMENT_DEPOSIT" && order.status !== "CANCELLED" && order.payments.some((p) => p.kind === "DEPOSIT" && p.status === "PAID")) {
        return { result: ok() };
      }
      if (input.kind === "PAYMENT_BALANCE" && order.status === "COMPLETED") return { result: ok() };
      if (locked.count !== 1) {
        return { result: fail(input.kind === "PAYMENT_DEPOSIT" ? "คำสั่งนี้จ่ายมัดจำแล้วหรือถูกยกเลิก" : "ร้านยังไม่ได้แจ้งว่างานเสร็จ") };
      }
      if (existing && existing.status !== "CREATED") {
        return { result: fail(existing.status === "FAILED" ? PAYMENT_FAILED : PAYMENT_IN_PROGRESS) };
      }
      const paid = paidAmount(order);
      if (paid > order.total) return { result: fail("ยอดชำระเกินยอดคำสั่ง กรุณาติดต่อทีมงานเพื่อตรวจสอบ") };
      const amount = input.kind === "PAYMENT_DEPOSIT" ? order.deposit : order.total - paid;
      if (amount === 0 && input.kind === "PAYMENT_BALANCE") {
        await finishOrder(tx, order, 0);
        return { result: ok() };
      }
      const amountMinor = amount * 100;
      if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > 2_147_483_647) {
        return { result: fail("ยอดชำระไม่ถูกต้อง กรุณาติดต่อทีมงาน") };
      }
      const operation = existing ?? await tx.moneyOperation.create({
        data: { key, orderId: order.id, kind: input.kind, amountMinor, gateway: gateway.name, requestedBy: input.userId, method: input.method },
      });
      if (operation.amountMinor !== amountMinor || operation.gateway !== gateway.name || operation.kind !== input.kind || operation.method !== input.method) {
        return { result: fail(PAYMENT_IN_PROGRESS) };
      }
      const claimed = await tx.moneyOperation.updateMany({
        where: { id: operation.id, status: "CREATED" },
        data: { status: "PROCESSING" },
      });
      if (claimed.count !== 1) return { result: fail(PAYMENT_IN_PROGRESS) };
      return { operation, reference: `${order.code}-${paymentKind}` };
    });
  } catch {
    // SQLite busy/write conflicts are safe to retry: no gateway call has happened.
    return fail("มีรายการอื่นกำลังดำเนินการ กรุณาลองอีกครั้ง");
  }
  if ("result" in reservation && reservation.result) return reservation.result;

  const { operation, reference } = reservation;
  let outcome;
  try {
    outcome = await gateway.execute({
      kind: input.kind,
      amountMinor: operation.amountMinor,
      currency: "THB",
      idempotencyKey: operation.key,
      reference,
      method: input.method,
    });
  } catch {
    await txSafeUnknown(operation.id, "Gateway outcome unavailable");
    return fail(PAYMENT_IN_PROGRESS);
  }
  if (outcome.status !== "SUCCEEDED") {
    try {
      await db.moneyOperation.updateMany({
        where: { id: operation.id, status: "PROCESSING" },
        data: { status: outcome.status, gatewayRef: outcome.reference, error: outcome.error ?? "" },
      });
    } catch {
      // Leave PROCESSING durable if persistence fails; it must not be charged again.
    }
    return fail(outcome.status === "FAILED" ? PAYMENT_FAILED : PAYMENT_IN_PROGRESS);
  }
  return finalizeCustomerPayment(operation.id, outcome.reference);
}

/** Internal finalization is shared by immediate capture and an explicit retrieval. */
async function finalizeCustomerPayment(operationId: string, gatewayRef: string): Promise<ActionResult> {
  let operation: MoneyOperation | null;
  try {
    operation = await db.moneyOperation.findUnique({ where: { id: operationId } });
  } catch {
    await txSafeUnknown(operationId, "Gateway succeeded; operation could not be read", gatewayRef);
    return fail(PAYMENT_IN_PROGRESS);
  }
  if (!operation || (operation.kind !== "PAYMENT_DEPOSIT" && operation.kind !== "PAYMENT_BALANCE")) return NOT_ALLOWED;
  if (operation.status === "SUCCEEDED") return ok();
  const expected = operation.kind === "PAYMENT_DEPOSIT" ? "AWAITING_DEPOSIT" : "DONE";
  const paymentKind = operation.kind === "PAYMENT_DEPOSIT" ? "DEPOSIT" : "BALANCE";
  try {
    return await db.$transaction(async (tx) => {
      const locked = await tx.order.updateMany({
        where: { id: operation.orderId, status: expected },
        data: { status: expected },
      });
      const current = await tx.moneyOperation.findUniqueOrThrow({ where: { id: operation.id } });
      if (current.status === "SUCCEEDED") return ok();
      if (locked.count !== 1) throw new Error("Order changed after payment reservation");
      const order = await tx.order.findUniqueOrThrow({ where: { id: operation.orderId }, include: orderInclude });
      const claimed = await tx.moneyOperation.updateMany({
        where: { id: operation.id, status: { in: ["PROCESSING", "PENDING", "UNKNOWN", "FAILED"] } },
        data: { status: "SUCCEEDED", gatewayRef, completedAt: new Date(), error: "" },
      });
      if (claimed.count !== 1) throw new Error("Payment operation cannot be finalized");
      await tx.payment.create({
        data: { orderId: order.id, kind: paymentKind, amount: operation.amountMinor / 100, method: operation.method, status: "PAID", gateway: operation.gateway, gatewayRef, paidAt: new Date() },
      });
      if (operation.kind === "PAYMENT_DEPOSIT") {
        await tx.order.update({ where: { id: order.id }, data: { status: "AWAITING_PROVIDER" } });
        await addEvent(tx, order.id, "จ่ายมัดจำแล้ว", "CUSTOMER", { note: `ได้รับมัดจำ ${formatBaht(operation.amountMinor / 100)}` });
        await notify(tx, order.provider.userId, "ORDER", "มีคำสั่งใหม่รอคุณยืนยัน", {
          body: `เลขที่ ${order.code} ลูกค้าจ่ายมัดจำแล้ว`, href: `/provider/orders/${order.id}`,
        });
      } else {
        await finishOrder(tx, order, operation.amountMinor / 100);
      }
      return ok();
    });
  } catch {
    await txSafeUnknown(operation.id, "Gateway succeeded; local finalization requires reconciliation", gatewayRef);
    return fail(PAYMENT_IN_PROGRESS);
  }
}

/** Caller must authenticate an administrator before allowing explicit reconciliation.
 * Read-only provider retrieval is safe to repeat; execute is NEVER called here.
 */
export async function reconcileCustomerPaymentOperation(operationId: string, gateway: PaymentGateway = payments): Promise<ActionResult> {
  const operation = await db.moneyOperation.findUnique({ where: { id: operationId }, include: { order: true } });
  if (!operation || (operation.kind !== "PAYMENT_DEPOSIT" && operation.kind !== "PAYMENT_BALANCE")) return NOT_ALLOWED;
  if (operation.status === "SUCCEEDED") return ok();
  if (operation.status === "CREATED" || operation.status === "FAILED" || operation.gateway !== gateway.name || (operation.method !== "PROMPTPAY" && operation.method !== "CARD")) {
    return fail("ข้อมูลรายการยังไม่พร้อมตรวจสอบ กรุณาติดต่อผู้ดูแลระบบ");
  }
  if (operation.status === "PROCESSING" && Date.now() - operation.updatedAt.getTime() < 60_000) return fail(PAYMENT_IN_PROGRESS);
  if (operation.order.status === "CANCELLED") return fail("คำสั่งนี้ถูกยกเลิก กรุณาตรวจสอบกับผู้ให้บริการชำระเงิน");
  let outcome;
  try {
    outcome = await gateway.retrieve({
      kind: operation.kind,
      amountMinor: operation.amountMinor,
      currency: "THB",
      idempotencyKey: operation.key,
      reference: `${operation.order.code}-${operation.kind === "PAYMENT_DEPOSIT" ? "DEPOSIT" : "BALANCE"}`,
      method: operation.method,
    });
  } catch {
    return fail(PAYMENT_IN_PROGRESS);
  }
  if (outcome.status === "SUCCEEDED") return finalizeCustomerPayment(operation.id, outcome.reference);
  await db.moneyOperation.updateMany({
    where: { id: operation.id, status: { not: "SUCCEEDED" } },
    data: { status: outcome.status === "FAILED" ? "UNKNOWN" : outcome.status, gatewayRef: outcome.reference, error: outcome.error ?? "" },
  });
  return fail(outcome.status === "FAILED" ? PAYMENT_FAILED : PAYMENT_IN_PROGRESS);
}
async function txSafeUnknown(id: string, error: string, gatewayRef?: string) {
  try {
    await db.moneyOperation.updateMany({
      where: { id, status: { in: ["PROCESSING", "PENDING", "UNKNOWN"] } },
      data: { status: "UNKNOWN", error, ...(gatewayRef ? { gatewayRef } : {}) },
    });
  } catch {
    // PROCESSING also blocks retries when the DB cannot record UNKNOWN.
  }
}

/** Payment and cancellation share the same order write lock. */
export async function cancelCustomerOrder(orderId: string, userId: string): Promise<ActionResult> {
  let result: ActionResult;
  try {
    result = await db.$transaction(async (tx) => {
      // Write before reading: cancellation and payment reserve the same order lock.
      const locked = await tx.order.updateMany({
        where: { id: orderId, userId: userId, status: { in: ["AWAITING_DEPOSIT", "AWAITING_PROVIDER", "CANCELLED"] } },
        data: { updatedAt: new Date() },
      });
      const order = await tx.order.findUnique({
        where: { id: orderId }, include: { provider: true, payments: true, moneyOperations: true },
      });
      if (!order || order.userId !== userId) return NOT_ALLOWED;
      if (order.status === "CANCELLED") return ok();
      if (locked.count !== 1) return fail("ร้านยืนยันคำสั่งแล้ว กรุณาติดต่อร้านเพื่อยกเลิก");
      const unresolved = order.moneyOperations.some((operation) =>
        (operation.kind === "PAYMENT_DEPOSIT" || operation.kind === "PAYMENT_BALANCE") && (
          ["CREATED", "PROCESSING", "PENDING", "UNKNOWN"].includes(operation.status) ||
          (operation.status === "SUCCEEDED" && !order.payments.some((payment) =>
            payment.kind === (operation.kind === "PAYMENT_DEPOSIT" ? "DEPOSIT" : "BALANCE") &&
            payment.gatewayRef === operation.gatewayRef && ["PAID", "REFUNDED"].includes(payment.status),
          ))
        ),
      );
      if (unresolved) return fail(PAYMENT_IN_PROGRESS);
      const hadDeposit = order.payments.some((payment) => payment.kind === "DEPOSIT" && payment.status === "PAID");
      const changed = await tx.order.updateMany({
        where: { id: order.id, status: order.status }, data: { status: "CANCELLED" },
      });
      if (changed.count !== 1) return fail("คำสั่งมีการเปลี่ยนแปลง กรุณาลองใหม่");
      await addEvent(tx, order.id, "ลูกค้ายกเลิกคำสั่ง", "CUSTOMER", {
        note: hadDeposit ? `ต้องคืนมัดจำ ${formatBaht(order.deposit)} ให้ลูกค้า` : "",
      });
      if (hadDeposit) {
        await notify(tx, order.provider.userId, "ORDER", "ลูกค้ายกเลิกคำสั่ง", {
          body: `เลขที่ ${order.code}`, href: `/provider/orders/${order.id}`,
        });
      }
      return ok();
    });
  } catch {
    return fail("มีรายการอื่นกำลังดำเนินการ กรุณาลองอีกครั้ง");
  }
  return result;
}
