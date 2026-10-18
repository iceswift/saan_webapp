import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { mockGateway, unconfiguredGateway, type PaymentGateway } from "../src/server/payment-gateway";
import { payoutOrderFunds, refundOrderFunds, reconcileSettlement } from "../src/server/settlement-service";
import { listFinanceOrders } from "../src/server/finance";

const testDatabaseUrl = process.env.DATABASE_URL ?? "";
if (/^postgres(?:ql)?:/.test(testDatabaseUrl)) assert.equal(new URL(testDatabaseUrl).pathname, "/saan_test");
else assert.match(testDatabaseUrl, /money-test\.db$/);
after(()=>db.$disconnect());

async function fixture(status = "CANCELLED", paid = 300) {
  const suffix = randomUUID();
  const customer = await db.user.create({data:{phone:`customer-${suffix}`}});
  const merchant = await db.user.create({data:{phone:`merchant-${suffix}`,role:"PROVIDER"}});
  const provider = await db.provider.create({data:{userId:merchant.id,name:"Test shop",kind:"SHOP",phone:"0800000003",areas:'["BKK"]',status:"VERIFIED"}});
  const order = await db.order.create({data:{code:`test-${suffix}`,userId:customer.id,providerId:provider.id,type:"INSTALL",status,area:"BKK",address:"Test only",total:1000,deposit:300,
    payments:{create:{kind:status === "CANCELLED" ? "DEPOSIT" : "BALANCE",amount:paid,method:"PROMPTPAY",status:"PAID",gateway:"mock",gatewayRef:`charge-${suffix}`,paidAt:new Date()}}}});
  return {customer,merchant,provider,order};
}

test("duplicate concurrent refunds finalize once with one audit event",async()=>{
  const {order} = await fixture();
  let calls=0;
  const gateway:PaymentGateway={...mockGateway,async execute(input){calls++;return mockGateway.execute(input);}};
  await Promise.allSettled([refundOrderFunds(order.id,"admin",gateway),refundOrderFunds(order.id,"admin",gateway)]);
  assert.equal((await refundOrderFunds(order.id,"admin",gateway)).ok,true);
  assert.equal(calls,1);
  assert.equal(await db.moneyOperation.count({where:{orderId:order.id,status:"SUCCEEDED",kind:"REFUND"}}),1);
  assert.equal(await db.payment.count({where:{orderId:order.id,status:"REFUNDED"}}),1);
  assert.equal(await db.orderEvent.count({where:{orderId:order.id,title:"คืนเงินแล้ว"}}),1);
});

test("completed fully paid work pays shop once despite duplicate requests",async()=>{
  const {order} = await fixture("COMPLETED",1000);
  let calls=0;
  const gateway:PaymentGateway={...mockGateway,async execute(input){calls++;return mockGateway.execute(input);}};
  await Promise.allSettled([payoutOrderFunds(order.id,"admin",gateway),payoutOrderFunds(order.id,"admin",gateway)]);
  assert.equal((await payoutOrderFunds(order.id,"admin",gateway)).ok,true);
  assert.equal(calls,1);
  assert.equal(await db.moneyOperation.count({where:{orderId:order.id,kind:"PAYOUT",status:"SUCCEEDED"}}),1);
  assert.equal(await db.orderEvent.count({where:{orderId:order.id,title:"จ่ายเงินให้ร้านแล้ว"}}),1);
});

test("no payout before acceptance, no underpaid payout, no refund of completed work",async()=>{
  const pending = await fixture("DONE",1000);
  assert.equal((await payoutOrderFunds(pending.order.id,"admin")).ok,false);
  const underpaid = await fixture("COMPLETED",300);
  assert.equal((await payoutOrderFunds(underpaid.order.id,"admin")).ok,false);
  assert.equal((await refundOrderFunds(underpaid.order.id,"admin")).ok,false);
});

test("refund timeout blocks repeat execution and retrieves original result exactly once",async()=>{
  const {order} = await fixture();
  let calls=0,retrievals=0;
  const gateway:PaymentGateway={name:"mock",async execute(){calls++;throw new Error("timeout");},async retrieve(input){retrievals++;return mockGateway.execute(input);}};
  assert.equal((await refundOrderFunds(order.id,"admin",gateway)).ok,false);
  assert.equal((await refundOrderFunds(order.id,"admin",gateway)).ok,false);
  const op=await db.moneyOperation.findFirstOrThrow({where:{orderId:order.id}});
  assert.equal(op.status,"UNKNOWN");
  assert.equal((await reconcileSettlement(op.id,gateway)).ok,true);
  assert.equal((await reconcileSettlement(op.id,gateway)).ok,true);
  assert.equal(calls,1);assert.equal(retrievals,1);
});

test("never reconcile undispatched requests and never refund via another gateway",async()=>{
  const {order} = await fixture();
  const op=await db.moneyOperation.create({data:{key:`${order.id}:manual-test`,orderId:order.id,kind:"PAYOUT",amountMinor:100000,requestedBy:"admin"}});
  assert.equal((await reconcileSettlement(op.id)).ok,false);
  assert.equal((await refundOrderFunds(order.id,"admin",unconfiguredGateway)).ok,false);
  assert.equal(await db.payment.count({where:{orderId:order.id,status:"PAID"}}),1);
});

test("shop finance never returns another shop's orders",async()=>{
  const first=await fixture("COMPLETED",1000);
  const other=await fixture("COMPLETED",1000);
  const own=await listFinanceOrders({id:first.merchant.id,role:"PROVIDER"});
  assert.ok(own.some(row=>row.id===first.order.id));
  assert.ok(!own.some(row=>row.id===other.order.id));
  assert.deepEqual(await listFinanceOrders({id:first.merchant.id,role:"PROVIDER"},other.provider.id),[]);
});

test("mock validation rejects fractional/negative amounts and stable keys preserve references",async()=>{
  const input={kind:"PAYMENT_DEPOSIT" as const,amountMinor:30000,currency:"THB" as const,idempotencyKey:randomUUID(),reference:"test"};
  assert.deepEqual(await mockGateway.execute(input),await mockGateway.retrieve(input));
  await assert.rejects(()=>mockGateway.execute({...input,amountMinor:-1}));
  await assert.rejects(()=>mockGateway.execute({...input,amountMinor:1.5}));
  assert.equal((await unconfiguredGateway.execute(input)).status,"FAILED");
  assert.equal((await mockGateway.retrieve({...input,idempotencyKey:randomUUID()})).status,"UNKNOWN");
});

test("stale negative retrieval never hides a later successful refund submission",async()=>{
  const {order}=await fixture();
  let release!:()=>void;
  let started!:()=>void;
  const ready=new Promise<void>(resolve=>{started=resolve;});
  const hold=new Promise<void>(resolve=>{release=resolve;});
  const gateway:PaymentGateway={name:"mock",async execute(input){started();await hold;return mockGateway.execute(input);},
    async retrieve(){return {status:"FAILED",reference:"",error:"not found yet"};}};
  const submitted=refundOrderFunds(order.id,"admin",gateway);
  await ready;
  const op=await db.moneyOperation.findFirstOrThrow({where:{orderId:order.id}});
  await db.moneyOperation.update({where:{id:op.id},data:{updatedAt:new Date(Date.now()-61_000)}});
  assert.equal((await reconcileSettlement(op.id,gateway)).ok,false);
  assert.equal((await db.moneyOperation.findUniqueOrThrow({where:{id:op.id}})).status,"UNKNOWN");
  release();
  assert.equal((await submitted).ok,true);
  assert.equal(await db.payment.count({where:{orderId:order.id,status:"REFUNDED"}}),1);
  assert.equal(await db.orderEvent.count({where:{orderId:order.id,title:"คืนเงินแล้ว"}}),1);
});
