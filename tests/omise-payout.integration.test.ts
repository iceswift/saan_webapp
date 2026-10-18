import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,test } from "node:test";
import { db } from "../src/server/db";
import { PAYOUT_TEST_POLICY,payoutTestEnabled,startTestPayout,reconcileTestPayout } from "../src/server/omise-payout-service";
import type { TestTransfer,TransferClient,TransferExpectation } from "../src/server/omise-transfer-client";

const url=process.env.DATABASE_URL??"";
if(/^postgres/.test(url))assert.equal(new URL(url).pathname,"/saan_test");else assert.match(url,/money-test\.db$/);
process.env.OMISE_PAYOUT_TEST_ENABLED="true";
process.env.OMISE_PAYOUT_TEST_RECIPIENT="recp_test_fixture";
after(()=>db.$disconnect());
async function fixture(){
  const suffix=randomUUID().replaceAll("-","");
  const buyer=await db.user.create({data:{phone:"payout-buyer-"+suffix}});
  const admin=await db.user.create({data:{phone:"payout-admin-"+suffix,role:"ADMIN"}});
  const shop=await db.user.create({data:{phone:"payout-shop-"+suffix,role:"PROVIDER"}});
  const provider=await db.provider.create({data:{userId:shop.id,name:"Payout test shop",kind:"SHOP",phone:"0800000003",areas:'["BKK"]'}});
  process.env.OMISE_PAYOUT_TEST_PROVIDER_ID=provider.id;
  const order=await db.order.create({data:{code:"PAYOUT-"+suffix,userId:buyer.id,providerId:provider.id,type:"INSTALL",status:"COMPLETED",area:"BKK",address:"Synthetic only",total:300,deposit:300,
    payments:{create:{kind:"DEPOSIT",amount:300,status:"PAID",method:"PROMPTPAY",gateway:"omise_test",gatewayRef:"chrg_test_"+suffix}},
    moneyOperations:{create:{key:"payout-charge-"+suffix,kind:"PAYMENT_DEPOSIT",amountMinor:30000,status:"SUCCEEDED",gateway:"omise_test",gatewayRef:"chrg_test_"+suffix,requestedBy:buyer.id}}}});
  return {buyer,admin,shop,provider,order};
}
function fake(){
  let calls=0;let transfer:TestTransfer|null=null;
  const client:TransferClient={account:async()=>"account_fixture",available:async()=>1_000_000_000,recipient:async()=>"destination_fixture",chargeNet:async()=>29500,
    create:async(e:TransferExpectation)=>{calls++;transfer={object:"transfer",id:"trsf_test_"+randomUUID().replaceAll("-",""),livemode:false,amount:e.amountMinor,currency:"THB",recipient:e.recipientId,metadata:{saan_payout:e.operationId},fee:1869,fee_vat:131,total_fee:2000,net:e.amountMinor-2000,sent:false,paid:false,deleted:false,failure_code:null};return transfer;},
    retrieve:async()=>{assert.ok(transfer);return transfer;},recover:async()=>transfer};
  return {client,calls:()=>calls,get:()=>transfer,set:(value:TestTransfer)=>{transfer=value;}};
}
async function operation(orderId:string){return db.moneyOperation.findFirstOrThrow({where:{orderId,kind:"PAYOUT"},include:{payoutAttempt:true}});}
test("payout requires explicit sandbox gate and never production",()=>{
  assert.equal(payoutTestEnabled({APP_ENV:"production",OMISE_PAYOUT_TEST_ENABLED:"true"}),false);
  assert.equal(payoutTestEnabled({NODE_ENV:"production",OMISE_PAYOUT_TEST_ENABLED:"true",OMISE_PAYOUT_TEST_RECIPIENT:"recp_test_fixture",OMISE_PAYOUT_TEST_PROVIDER_ID:"shop"}),false);
});
test("only admin can dispatch; invalid policy, recipient or order prevents reservation",async()=>{
  const f=await fixture(),g=fake();
  assert.equal((await startTestPayout(f.order.id,f.buyer.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  assert.equal((await startTestPayout(f.order.id,f.admin.id,"unapproved",g.client)).ok,false);
  const paused=process.env.PAYMENT_MUTATIONS_DISABLED;process.env.PAYMENT_MUTATIONS_DISABLED="true";
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  if(paused===undefined)delete process.env.PAYMENT_MUTATIONS_DISABLED;else process.env.PAYMENT_MUTATIONS_DISABLED=paused;
  const bad={...g.client,recipient:async()=>{throw new Error("inactive");}};
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,bad)).ok,false);
  await db.order.update({where:{id:f.order.id},data:{status:"DONE"}});
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  assert.equal(g.calls(),0);assert.equal(await db.payoutAttempt.count({where:{operation:{orderId:f.order.id}}}),0);
});
test("concurrent requests dispatch once; sent alone never finalizes; paid finalizes one event",async()=>{
  const f=await fixture(),g=fake();
  await Promise.all([startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client),startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)]);
  assert.equal(g.calls(),1);const op=await operation(f.order.id);
  assert.equal(op.amountMinor,29500);assert.equal(op.payoutAttempt?.collectionFeeMinor,500);assert.equal(op.status,"PENDING");
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  g.set({...g.get()!,sent:true});await reconcileTestPayout(op.id,g.client);
  assert.equal((await operation(f.order.id)).status,"PENDING");
  g.set({...g.get()!,paid:true});await Promise.all([reconcileTestPayout(op.id,g.client),reconcileTestPayout(op.id,g.client)]);
  assert.equal((await operation(f.order.id)).status,"SUCCEEDED");
  assert.equal((await operation(f.order.id)).payoutAttempt?.bankNetMinor,27500);
  assert.equal(await db.orderEvent.count({where:{orderId:f.order.id,title:"จ่ายร้านทดสอบสำเร็จแล้ว"}}),1);assert.equal(g.calls(),1);
});
test("lost POST response recovers original identity from metadata without another dispatch",async()=>{
  const f=await fixture(),g=fake();const create=g.client.create;
  g.client.create=async e=>{await create(e);throw new Error("response lost");};
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  const op=await operation(f.order.id);assert.equal(op.status,"UNKNOWN");assert.equal(op.gatewayRef,"");
  g.set({...g.get()!,sent:true,paid:true});
  const restarted={...g.client,create:async()=>{throw new Error("must never replay");}};
  assert.equal((await reconcileTestPayout(op.id,restarted)).ok,true);assert.equal((await operation(f.order.id)).gatewayRef,g.get()!.id);assert.equal(g.calls(),1);
});
test("missing original, changed account or destination retains unknown reservation",async()=>{
  const f=await fixture(),g=fake();g.client.create=async()=>{throw new Error("unknown");};
  await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client);const op=await operation(f.order.id);
  assert.equal((await reconcileTestPayout(op.id,g.client)).ok,false);
  assert.equal((await reconcileTestPayout(op.id,{...g.client,account:async()=>"other"})).ok,false);
  assert.equal((await reconcileTestPayout(op.id,{...g.client,recipient:async()=>"changed"})).ok,false);
  assert.equal((await operation(f.order.id)).status,"UNKNOWN");
});
test("refund and unknown payout reservations prevent spending the same available funds",async()=>{
  const f=await fixture(),g=fake();
  const refunds=await db.payment.aggregate({where:{gateway:"omise_test",status:"PAID",order:{status:{in:["CANCELLED","AWAITING_PROVIDER"]}}},_sum:{amount:true}});
  const reserved=await db.moneyOperation.aggregate({where:{gateway:"omise_test",kind:"PAYOUT",status:{not:"SUCCEEDED"}},_sum:{amountMinor:true}});
  g.client.available=async()=>((refunds._sum.amount??0)*100)+(reserved._sum.amountMinor??0)+29499;
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  assert.equal(g.calls(),0);assert.equal(await db.payoutAttempt.count({where:{operation:{orderId:f.order.id}}}),0);
});
test("two different orders cannot reserve the same available account balance",async()=>{
  const f=await fixture(),g=fake(),suffix=randomUUID().replaceAll("-","");
  const second=await db.order.create({data:{code:"POOL-"+suffix,userId:f.buyer.id,providerId:f.provider.id,type:"INSTALL",status:"COMPLETED",area:"BKK",address:"Synthetic",total:300,deposit:300,
    payments:{create:{kind:"DEPOSIT",amount:300,status:"PAID",method:"PROMPTPAY",gateway:"omise_test",gatewayRef:"chrg_test_"+suffix}},
    moneyOperations:{create:{key:"pool-charge-"+suffix,kind:"PAYMENT_DEPOSIT",amountMinor:30000,status:"SUCCEEDED",gateway:"omise_test",gatewayRef:"chrg_test_"+suffix,requestedBy:f.buyer.id}}}});
  const refunds=await db.payment.aggregate({where:{gateway:"omise_test",status:"PAID",order:{status:{in:["CANCELLED","AWAITING_PROVIDER"]}}},_sum:{amount:true}});
  const reserved=await db.moneyOperation.aggregate({where:{gateway:"omise_test",kind:"PAYOUT",status:{not:"SUCCEEDED"}},_sum:{amountMinor:true}});
  g.client.available=async()=>((refunds._sum.amount??0)*100)+(reserved._sum.amountMinor??0)+29500;
  await Promise.all([startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client),startTestPayout(second.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)]);
  assert.equal(g.calls(),1);assert.equal(await db.payoutAttempt.count({where:{operation:{orderId:{in:[f.order.id,second.id]}}}}),1);
});
test("provider acceptance followed by local write failure recovers once without resubmission",async t=>{
  const f=await fixture(),g=fake(),trigger="payout_failure_"+randomUUID().replaceAll("-","");const pg=/^postgres/.test(url);
  if(pg){
    await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."orderId" = '${f.order.id}' AND NEW.kind = 'PAYOUT' AND NEW.status = 'PENDING' THEN RAISE EXCEPTION 'payout write failure'; END IF; RETURN NEW; END $$`);
    await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE UPDATE ON "MoneyOperation" FOR EACH ROW EXECUTE FUNCTION ${trigger}()`);
  }else await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE UPDATE ON MoneyOperation WHEN NEW.orderId = '${f.order.id}' AND NEW.kind = 'PAYOUT' AND NEW.status = 'PENDING' BEGIN SELECT RAISE(ABORT, 'payout write failure'); END`);
  const drop=async()=>{await db.$executeRawUnsafe(pg?`DROP TRIGGER IF EXISTS ${trigger} ON "MoneyOperation"`:`DROP TRIGGER IF EXISTS ${trigger}`);if(pg)await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}()`);};t.after(drop);
  assert.equal((await startTestPayout(f.order.id,f.admin.id,PAYOUT_TEST_POLICY,g.client)).ok,false);
  const op=await operation(f.order.id);assert.equal(op.status,"UNKNOWN");assert.equal(op.gatewayRef,"");assert.equal(g.calls(),1);
  await drop();g.set({...g.get()!,sent:true,paid:true});
  assert.equal((await reconcileTestPayout(op.id,g.client)).ok,true);assert.equal((await operation(f.order.id)).status,"SUCCEEDED");assert.equal(g.calls(),1);
});
