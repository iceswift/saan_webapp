import "server-only";
import { db } from "./db";
import { isStagingTestMode } from "./runtime-policy";
import { lockPaymentPool } from "./payment-pool";
import { createTransferClient, type TransferClient, type TestTransfer } from "./omise-transfer-client";
import { fail, ok } from "../lib/result";
import { addEvent } from "./action-utils";

export const PAYOUT_TEST_POLICY="SANDBOX_SHOP_ABSORBS_COSTS_V1";
export function payoutTestEnabled(env:Record<string,string|undefined>=process.env){
  return env.OMISE_PAYOUT_TEST_ENABLED==="true" && env.APP_ENV!=="production" &&
    (env.APP_ENV==="staging"?isStagingTestMode(env):env.NODE_ENV!=="production") &&
    /^recp_test_[a-z0-9]+$/.test(env.OMISE_PAYOUT_TEST_RECIPIENT??"") && Boolean(env.OMISE_PAYOUT_TEST_PROVIDER_ID);
}
async function admin(actorId:string){return (await db.user.findUnique({where:{id:actorId},select:{role:true}}))?.role==="ADMIN";}

export async function startTestPayout(orderId:string,actorId:string,policy:string,providedClient?:TransferClient){
  if(!payoutTestEnabled() || !await admin(actorId))return fail("ยังไม่เปิดการจ่ายร้านทดสอบหรือไม่มีสิทธิ์");
  if(process.env.PAYMENT_MUTATIONS_DISABLED==="true")return fail("พักการส่งรายการเงินชั่วคราว ยังตรวจสอบรายการเดิมได้");
  if(policy!==PAYOUT_TEST_POLICY)return fail("ต้องยืนยันนโยบายทดสอบก่อนส่งรายการ");
  try {
    const client=providedClient??createTransferClient();
    const recipientId=process.env.OMISE_PAYOUT_TEST_RECIPIENT!;
    const accountId=await client.account();
    const destinationHash=await client.recipient(recipientId);
    const order=await db.order.findUnique({where:{id:orderId},include:{payments:true,moneyOperations:true}});
    if(!order || order.status!=="COMPLETED" || order.providerId!==process.env.OMISE_PAYOUT_TEST_PROVIDER_ID ||
      order.payments.length===0 || order.payments.some(p=>p.gateway!=="omise_test"||p.status!=="PAID") ||
      order.payments.reduce((s,p)=>s+p.amount,0)!==order.total || order.moneyOperations.some(o=>o.kind==="REFUND"))return fail("งานหรือยอดรับชำระไม่ผ่านเงื่อนไขจ่ายร้านทดสอบ");
    if(order.moneyOperations.some(o=>o.kind==="PAYOUT"))return fail("มีรายการจ่ายเดิมแล้ว กรุณาตรวจสอบผลเดิม ห้ามส่งซ้ำ");
    let amountMinor=0;
    for(const payment of order.payments){
      const charge=order.moneyOperations.find(o=>o.gatewayRef===payment.gatewayRef && o.status==="SUCCEEDED" && ["PAYMENT_DEPOSIT","PAYMENT_BALANCE"].includes(o.kind));
      if(!charge)return fail("ไม่พบหลักฐานรับชำระเดิม");
      amountMinor+=await client.chargeNet(payment.gatewayRef,payment.amount*100,charge.key);
    }
    if(amountMinor<=2000)return fail("ยอดไม่เพียงพอสำหรับค่าธรรมเนียมโอนทดสอบ");
    const reserved=await db.$transaction(async tx=>{
      const pool=await lockPaymentPool(tx);
      if(pool.accountId && pool.accountId!==accountId)throw new Error("Account changed");
      if(!pool.accountId)await tx.paymentPool.update({where:{id:pool.id},data:{accountId}});
      const lock=await tx.order.updateMany({where:{id:orderId,status:"COMPLETED"},data:{status:"COMPLETED"}});
      if(lock.count!==1 || await tx.moneyOperation.count({where:{orderId,kind:{in:["PAYOUT","REFUND"]}}}))throw new Error("Order changed");
      // Keep the account lock while fetching balance. Completion/refund reservations use the same lock.
      const available=await client.available();
      const refundPayments=await tx.payment.findMany({where:{gateway:"omise_test",status:"PAID",order:{status:{in:["CANCELLED","AWAITING_PROVIDER"]}}},select:{amount:true}});
      const refundReserve=refundPayments.reduce((sum,p)=>sum+p.amount*100,0);
      const pending=await tx.moneyOperation.aggregate({where:{gateway:"omise_test",kind:"PAYOUT",status:{not:"SUCCEEDED"}},_sum:{amountMinor:true}});
      if(available-refundReserve-(pending._sum.amountMinor??0)<amountMinor)throw new Error("Insufficient unreserved balance");
      const op=await tx.moneyOperation.create({data:{key:orderId+":PAYOUT",orderId,kind:"PAYOUT",amountMinor,gateway:"omise_test",status:"PROCESSING",requestedBy:actorId,
        payoutAttempt:{create:{accountId,recipientId,destinationHash,grossMinor:order.total*100,collectionFeeMinor:order.total*100-amountMinor,policy:PAYOUT_TEST_POLICY}}}});
      await addEvent(tx,orderId,"สำรองยอดจ่ายร้านทดสอบแล้ว","ADMIN",{note:"ยังไม่ยืนยันผลโอน · นโยบายทดสอบหักค่ารับชำระและค่าโอนจากยอดร้าน"});
      return op;
    },{timeout:30000,maxWait:10000});
    // A committed PROCESSING operation is a one-shot dispatch reservation, never re-executable.
    try {
      if(process.env.PAYMENT_MUTATIONS_DISABLED==="true" || await client.recipient(recipientId)!==destinationHash || await client.account()!==accountId)throw new Error("Paused or destination changed");
      const transfer=await client.create({amountMinor,recipientId,operationId:reserved.id});
      return await finalizeTestPayout(reserved.id,transfer);
    } catch {
      await db.moneyOperation.updateMany({where:{id:reserved.id,status:{not:"SUCCEEDED"}},data:{status:"UNKNOWN",error:"ไม่ทราบผลส่งรายการ ต้องค้นหารายการเดิม ห้ามส่งซ้ำ"}});
      return fail("ยังไม่ทราบผล ระบบเก็บยอดสำรองไว้ กรุณาตรวจสอบรายการเดิม");
    }
  } catch {return fail("ยังส่งไม่ได้ กรุณาตรวจยอดพร้อมโอน ยอดสำรองคืนลูกค้า และผู้รับทดสอบ ไม่มีการส่งรายการซ้ำ");}
}

async function finalizeTestPayout(operationId:string,t:TestTransfer){
  return db.$transaction(async tx=>{
    await lockPaymentPool(tx);
    const op=await tx.moneyOperation.findUniqueOrThrow({where:{id:operationId},include:{payoutAttempt:true,order:true}});
    const a=op.payoutAttempt;
    if(!a || op.gateway!=="omise_test" || op.kind!=="PAYOUT" || op.order.status!=="COMPLETED" || t.livemode!==false || t.amount!==op.amountMinor ||
      (typeof t.recipient==="string"?t.recipient:t.recipient.id)!==a.recipientId || t.metadata.saan_payout!==op.id || (op.gatewayRef && op.gatewayRef!==t.id))throw new Error("Identity mismatch");
    if(op.status==="SUCCEEDED")return ok();
    const succeeded=t.paid && t.sent && !t.deleted && !t.failure_code;
    await tx.payoutAttempt.update({where:{id:a.id},data:{transferFeeMinor:t.total_fee,bankNetMinor:t.net}});
    await tx.moneyOperation.update({where:{id:op.id},data:{gatewayRef:t.id,status:succeeded?"SUCCEEDED":t.deleted||t.failure_code?"UNKNOWN":"PENDING",
      completedAt:succeeded?new Date():null,error:succeeded?"":"รอตรวจสอบผลโอนเดิม ยอดยังถูกสำรอง"}});
    if(succeeded)await addEvent(tx,op.orderId,"จ่ายร้านทดสอบสำเร็จแล้ว","ADMIN",{note:`รายการทดสอบ ${t.id} · ยอดสุทธิ ${t.net/100} บาท ไม่มีการโอนเงินจริง`});
    return ok();
  });
}

export async function reconcileTestPayout(operationId:string,providedClient?:TransferClient){
  if(!payoutTestEnabled())return fail("ยังไม่เปิดตรวจผลจ่ายร้านทดสอบ");
  try{
    const client=providedClient??createTransferClient();
    const op=await db.moneyOperation.findUnique({where:{id:operationId},include:{payoutAttempt:true}});
    if(!op?.payoutAttempt || op.gateway!=="omise_test" || op.kind!=="PAYOUT")return fail("ไม่พบรายการจ่ายทดสอบ");
    if(op.status==="SUCCEEDED")return ok();
    if(op.status==="PROCESSING" && Date.now()-op.updatedAt.getTime()<60000)return fail("กำลังส่งรายการ กรุณารอก่อนตรวจสอบ");
    const a=op.payoutAttempt;
    if(await client.account()!==a.accountId || await client.recipient(a.recipientId)!==a.destinationHash)throw new Error("Account or destination changed");
    const expected={amountMinor:op.amountMinor,recipientId:a.recipientId,operationId:op.id};
    const t=op.gatewayRef?await client.retrieve(op.gatewayRef,expected):await client.recover(expected);
    if(!t)return fail("ยังไม่พบรายการเดิม ยังคงสำรองยอดไว้ ห้ามส่งรายการใหม่");
    return await finalizeTestPayout(op.id,t);
  }catch{return fail("ยืนยันรายการเดิมไม่ได้ ต้องตรวจสอบกับผู้ให้บริการ ห้ามส่งซ้ำ");}
}

export async function reconcileTestPayoutBatch(providedClient?:TransferClient){
  if(!payoutTestEnabled())return 0;
  const ops=await db.moneyOperation.findMany({where:{gateway:"omise_test",kind:"PAYOUT",payoutAttempt:{isNot:null},status:{in:["PROCESSING","PENDING","UNKNOWN"]},updatedAt:{lt:new Date(Date.now()-60000)}},take:3,orderBy:{updatedAt:"asc"}});
  for(const op of ops){
    await reconcileTestPayout(op.id,providedClient);
    // Rotate unresolved checks too, so missing transfers cannot starve later attempts.
    // Compare the original timestamp to avoid overwriting a concurrent result.
    await db.moneyOperation.updateMany({where:{id:op.id,updatedAt:op.updatedAt,status:{in:["PROCESSING","PENDING","UNKNOWN"]}},data:{updatedAt:new Date()}});
  }
  return ops.length;
}
