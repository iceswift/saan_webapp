import "server-only";
import type { MoneyOperation } from "@prisma/client";
import { db } from "./db";
import { payments } from "./integrations";
import type { GatewayRequest, GatewayResult, PaymentGateway } from "./payment-gateway";
import { addEvent, notify } from "./action-utils";
import { formatBaht } from "../lib/format";
import { fail, ok, type ActionResult } from "../lib/result";
import { recordRefundObligations } from "./refund-obligations";

const unresolved = ["CREATED","PROCESSING","PENDING","UNKNOWN"];

async function settle(op: MoneyOperation, gateway: PaymentGateway, reconcile = false): Promise<ActionResult> {
  if (op.status === "SUCCEEDED") return ok();
  if ((op.kind === "REFUND" && gateway.capabilities?.refund === false) ||
      (op.kind === "PAYOUT" && gateway.capabilities?.payout === false)) {
    return fail("ผู้ให้บริการนี้ยังไม่รองรับขั้นตอนดังกล่าว ไม่มีการส่งคำสั่งคืนเงินหรือโอนเงิน");
  }
  if (reconcile && (op.status === "CREATED" ||
      (op.status === "PROCESSING" && Date.now() - op.updatedAt.getTime() < 60_000))) {
    return fail("รายการนี้กำลังส่งคำขอ กรุณารอก่อนตรวจสอบผล");
  }
  if (op.gateway !== gateway.name) return fail("ผู้ให้บริการของรายการไม่ตรงกัน กรุณาตรวจสอบรายการเดิม");
  if (!reconcile && op.status !== "CREATED") return fail("รายการนี้ต้องตรวจสอบผลเดิมก่อนทำต่อ");
  if (op.status === "FAILED") return fail("รายการไม่สำเร็จ กรุณาตรวจสอบกับผู้ให้บริการก่อนสร้างรายการใหม่");
  if (!reconcile) {
    const claim = await db.moneyOperation.updateMany({where:{id:op.id,status:"CREATED"},data:{status:"PROCESSING"}});
    if (!claim.count) return fail("รายการนี้กำลังดำเนินการ");
  }
  const payment = op.paymentId ? await db.payment.findUnique({where:{id:op.paymentId}}) : null;
  const request: GatewayRequest = {
    kind:op.kind as "REFUND" | "PAYOUT",amountMinor:op.amountMinor,currency:"THB",
    idempotencyKey:op.key,reference:op.orderId,
    ...(payment ? {originalReference:payment.gatewayRef} : {}),
  };
  let result: GatewayResult;
  try { result = await (reconcile ? gateway.retrieve(request) : gateway.execute(request)); }
  catch { result = {status:"UNKNOWN",reference:"",error:"ยังไม่ทราบผล กรุณาตรวจสอบรายการเดิม ห้ามโอนซ้ำ"}; }
  if (result.status !== "SUCCEEDED") {
    // An in-flight submission may still succeed. A negative retrieval must not
    // discard that uncertainty or permanently strand its later success.
    if (reconcile && result.status === "FAILED") result = {...result,status:"UNKNOWN"};
    await db.moneyOperation.updateMany({where:{id:op.id,status:{in:unresolved}},data:{status:result.status,
      gatewayRef:result.reference,error:result.error ?? "รอผู้ให้บริการยืนยันผล"}});
    return fail(result.error ?? "รายการยังไม่สำเร็จ กรุณาตรวจสอบผลภายหลัง");
  }
  // Financial state and its audit trail commit together. A duplicate callback changes nothing.
  try { return await db.$transaction(async tx => {
    const order = await tx.order.findUniqueOrThrow({where:{id:op.orderId},include:{provider:true}});
    const requiredStatus = op.kind === "REFUND" ? "CANCELLED" : "COMPLETED";
    if (order.status !== requiredStatus) return fail("สถานะงานไม่รองรับรายการเงินนี้");
    const claim = await tx.moneyOperation.updateMany({where:{id:op.id,status:{in:[...unresolved,"FAILED"]}},
      data:{status:"SUCCEEDED",gatewayRef:result.reference,error:"",completedAt:new Date()}});
    if (!claim.count) {
      const current = await tx.moneyOperation.findUniqueOrThrow({where:{id:op.id}});
      if (current.status === "SUCCEEDED") return ok();
      throw new Error("สถานะรายการเงินไม่ตรงกัน");
    }
    if (op.kind === "REFUND") {
      if (!payment) throw new Error("ไม่พบรายการรับชำระเดิม");
      const updated = await tx.payment.updateMany({where:{id:payment.id,status:"PAID"},data:{status:"REFUNDED",refundedAt:new Date()}});
      if (!updated.count) throw new Error("สถานะรายการรับชำระไม่ตรงกัน");
    }
    const title = op.kind === "REFUND" ? "คืนเงินแล้ว" : "จ่ายเงินให้ร้านแล้ว";
    const note = `${gateway.name === "mock" ? "รายการจำลอง · " : ""}${formatBaht(op.amountMinor / 100)} · ${result.reference}`;
    await addEvent(tx,order.id,title,"ADMIN",{note});
    await notify(tx,op.kind === "REFUND" ? order.userId : order.provider.userId,"ORDER",title,
      {body:note,href:op.kind === "REFUND" ? `/orders/${order.id}` : "/provider/finance"});
    return ok();
  }); } catch {
    await db.moneyOperation.updateMany({where:{id:op.id,status:{in:unresolved}},data:{status:"UNKNOWN",
      gatewayRef:result.reference,error:"ผู้ให้บริการยืนยันแล้ว แต่ยังบันทึกผลไม่สำเร็จ กรุณาตรวจสอบผลเดิม"}});
    return fail("ยังบันทึกผลไม่สำเร็จ กรุณาตรวจสอบรายการเดิมก่อนทำซ้ำ");
  }
}

export async function refundOrderFunds(orderId: string, actorId: string, gateway: PaymentGateway = payments): Promise<ActionResult> {
  const order = await db.order.findUnique({where:{id:orderId},include:{payments:true}});
  if (!order || order.status !== "CANCELLED") return fail("คืนเงินได้เฉพาะคำสั่งที่ยกเลิกแล้ว");
  const paid = order.payments.filter(p=>p.status === "PAID");
  if (!paid.length) return order.payments.some(p=>p.status === "REFUNDED") ? ok() : fail("ไม่มียอดที่ต้องคืน");
  if (paid.some(payment => payment.gateway !== gateway.name)) return fail("ต้องคืนผ่านผู้ให้บริการของรายการชำระเดิม");
  if (gateway.capabilities?.refund === false) {
    await db.$transaction(async tx => {
      const locked = await tx.order.updateMany({ where: { id: orderId, status: "CANCELLED" }, data: { status: "CANCELLED" } });
      if (locked.count !== 1) throw new Error("Order changed");
      await recordRefundObligations(tx, orderId, actorId);
    });
    return fail("บันทึกยอดที่ต้องคืนแล้ว ต้องตรวจสอบขั้นตอนกับผู้ให้บริการ ยังไม่ได้คืนเงิน");
  }
  for (const payment of paid) {
    if (payment.gateway !== gateway.name) return fail("ต้องคืนผ่านผู้ให้บริการของรายการชำระเดิม");
    const op = await db.$transaction(async tx => {
      const lock = await tx.order.updateMany({where:{id:orderId,status:"CANCELLED"},data:{status:"CANCELLED"}});
      if (!lock.count) throw new Error("สถานะงานเปลี่ยนแล้ว");
      return tx.moneyOperation.upsert({where:{key:`${payment.id}:REFUND`},update:{},create:{
        key:`${payment.id}:REFUND`,orderId,paymentId:payment.id,kind:"REFUND",amountMinor:payment.amount*100,
        requestedBy:actorId,gateway:gateway.name,
      }});
    });
    const result = await settle(op,gateway);
    if (!result.ok) return result;
  }
  return ok();
}

export async function payoutOrderFunds(orderId: string, actorId: string, gateway: PaymentGateway = payments): Promise<ActionResult> {
  if (gateway.capabilities?.payout === false) return fail("ยังไม่เปิดการโอนเงินให้ร้านสำหรับผู้ให้บริการนี้");
  const reserved = await db.$transaction(async tx => {
    const lock = await tx.order.updateMany({where:{id:orderId,status:"COMPLETED"},data:{status:"COMPLETED"}});
    if (!lock.count) return fail("จ่ายร้านได้หลังลูกค้าตรวจรับงานแล้วเท่านั้น");
    const order = await tx.order.findUniqueOrThrow({where:{id:orderId},include:{payments:true}});
    const paid = order.payments.filter(p=>p.status === "PAID");
    if (paid.reduce((sum,p)=>sum+p.amount,0) !== order.total) return fail("ยอดรับชำระไม่ตรงกับยอดงาน กรุณาตรวจสอบก่อนจ่ายร้าน");
    if (paid.some(p=>p.gateway !== gateway.name)) return fail("ผู้ให้บริการของยอดรับชำระไม่ตรงกัน");
    const op = await tx.moneyOperation.upsert({where:{key:`${orderId}:PAYOUT`},update:{},create:{
      key:`${orderId}:PAYOUT`,orderId,kind:"PAYOUT",amountMinor:order.total*100,requestedBy:actorId,gateway:gateway.name,
    }});
    return {ok:true as const,op};
  });
  if (!reserved.ok) return reserved;
  return settle(reserved.op,gateway);
}

export async function reconcileSettlement(operationId: string, gateway: PaymentGateway = payments): Promise<ActionResult> {
  const op = await db.moneyOperation.findUnique({where:{id:operationId}});
  if (!op || !["REFUND","PAYOUT"].includes(op.kind)) return fail("ไม่พบรายการคืนเงินหรือจ่ายร้าน");
  return settle(op,gateway,true);
}
