import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { changeRefundCase, customerRefundCases, refundCaseTestEnabled } from "../src/server/refund-case-service";
import { recordRefundObligations } from "../src/server/refund-obligations";
import { listFinanceOrders } from "../src/server/finance";

const url = process.env.DATABASE_URL ?? "";
if (/^postgres/.test(url)) assert.equal(new URL(url).pathname,"/saan_test");
else assert.match(url,/money-test\.db$/);
process.env.REFUND_CASE_TEST_MODE = "true";
after(() => db.$disconnect());
async function fixture() {
  const suffix = randomUUID();
  const customer = await db.user.create({data:{phone:`refund-customer-${suffix}`}});
  const admin = await db.user.create({data:{phone:`refund-admin-${suffix}`,role:"ADMIN"}});
  const shop = await db.user.create({data:{phone:`refund-shop-${suffix}`,role:"PROVIDER"}});
  const provider = await db.provider.create({data:{userId:shop.id,name:"Synthetic refund shop",kind:"SHOP",phone:"0800000003",areas:'["BKK"]'}});
  const order = await db.order.create({data:{code:`REFUND-${suffix}`,userId:customer.id,providerId:provider.id,type:"INSTALL",status:"CANCELLED",area:"BKK",address:"Synthetic only",total:100,deposit:30,
    payments:{create:{kind:"DEPOSIT",amount:30,method:"PROMPTPAY",status:"PAID",gateway:"omise_test",gatewayRef:`chrg_test_${suffix.replaceAll("-","")}`}}}});
  await db.$transaction(tx => recordRefundObligations(tx,order.id,customer.id));
  const op = await db.moneyOperation.findFirstOrThrow({where:{orderId:order.id,kind:"REFUND"}});
  return {customer,admin,shop,provider,order,op};
}
test("refund case gate always denies production and requires explicit private sandbox opt-in", () => {
  assert.equal(refundCaseTestEnabled({NODE_ENV:"production",REFUND_CASE_TEST_MODE:"true"}),false);
  assert.equal(refundCaseTestEnabled({APP_ENV:"production",NODE_ENV:"test",REFUND_CASE_TEST_MODE:"true"}),false);
  assert.equal(refundCaseTestEnabled({APP_ENV:"staging",REFUND_CASE_TEST_MODE:"true",STAGING_TEST_MODE:"true",STAGING_TEST_PHONES:"0800000001"}),true);
  assert.equal(refundCaseTestEnabled({APP_ENV:"staging",REFUND_CASE_TEST_MODE:"true"}),false);
});
test("only admins open one full-amount sandbox case; customer projection excludes internal evidence", async () => {
  const f = await fixture(); const open = {action:"OPEN",operationId:f.op.id,amountMinor:3000};
  assert.equal((await changeRefundCase(f.customer.id,open)).ok,false);
  assert.equal((await changeRefundCase(f.shop.id,open)).ok,false);
  for (const amountMinor of [3001,2999,-1,0,30.5]) assert.equal((await changeRefundCase(f.admin.id,{...open,amountMinor})).ok,false);
  await Promise.allSettled([changeRefundCase(f.admin.id,open),changeRefundCase(f.admin.id,open)]);
  assert.equal((await changeRefundCase(f.admin.id,open)).ok,true);
  assert.equal(await db.refundCase.count({where:{operationId:f.op.id}}),1);
  const entry = await db.refundCase.findUniqueOrThrow({where:{operationId:f.op.id}});
  assert.equal(await db.refundCaseEvent.count({where:{caseId:entry.id}}),1);
  assert.equal((await customerRefundCases(f.order.id,f.shop.id)).length,0);
  const projection=(await customerRefundCases(f.order.id,f.customer.id))[0];
  assert.equal("destination" in projection,false); assert.equal("events" in projection,false);
  const finance=(await listFinanceOrders({id:f.shop.id,role:"PROVIDER"}))[0];
  assert.ok(finance.operations.every(operation => operation.refundCase === null));
});
test("stale approvals, real bank details, duplicate reference and invalid transitions cannot complete a case", async () => {
  const f=await fixture();
  await changeRefundCase(f.admin.id,{action:"OPEN",operationId:f.op.id,amountMinor:3000});
  let entry=await db.refundCase.findUniqueOrThrow({where:{operationId:f.op.id}});
  const act=async(action:string,extra:Record<string,unknown>={})=>{
    const result=await changeRefundCase(f.admin.id,{caseId:entry.id,version:entry.version,action,...extra});
    entry=await db.refundCase.findUniqueOrThrow({where:{id:entry.id}}); return result;
  };
  assert.equal((await act("APPROVE")).ok,false);
  assert.equal((await act("DETAILS",{destination:"1234567890"})).ok,false);
  assert.equal((await act("DETAILS",{destination:"TEST-DEST-AAA"})).ok,true);
  assert.equal((await act("VERIFY")).ok,true);
  assert.equal((await act("APPROVE")).ok,true);
  const old=entry;
  assert.equal((await act("DETAILS",{destination:"TEST-DEST-BBB"})).ok,true);
  assert.equal(entry.status,"DETAILS_RECEIVED");
  assert.equal((await changeRefundCase(f.admin.id,{caseId:old.id,version:old.version,action:"SEND",reference:"TEST-TRANSFER-AAA",evidence:"TEST-EVIDENCE-AAA"})).ok,false);
  assert.equal((await act("SEND",{reference:"TEST-TRANSFER-AAA",evidence:"TEST-EVIDENCE-AAA"})).ok,false);
  await act("VERIFY"); await act("APPROVE");
  assert.equal((await act("SEND",{reference:"TEST-TRANSFER-AAA",evidence:""})).ok,false);
  assert.equal((await act("SEND",{reference:`TEST-TRANSFER-${f.op.id.toUpperCase()}`,evidence:"TEST-EVIDENCE-AAA"})).ok,true);
  const before=entry;
  const attempts=await Promise.all([changeRefundCase(f.admin.id,{action:"COMPLETE",caseId:entry.id,version:entry.version,verification:"TEST-VERIFY-AAA"}),changeRefundCase(f.admin.id,{action:"COMPLETE",caseId:entry.id,version:entry.version,verification:"TEST-VERIFY-BBB"})]);
  assert.equal(attempts.filter(result=>result.ok).length,1);
  entry=await db.refundCase.findUniqueOrThrow({where:{id:entry.id}});
  assert.equal(entry.status,"TEST_COMPLETED"); assert.equal(entry.version,before.version+1);
  assert.equal((await db.payment.findFirstOrThrow({where:{orderId:f.order.id}})).status,"PAID");
  assert.equal((await db.moneyOperation.findUniqueOrThrow({where:{id:f.op.id}})).status,"ACTION_REQUIRED");
  assert.equal(await db.refundCaseEvent.count({where:{caseId:entry.id,action:"COMPLETE"}}),1);
  const finance=(await listFinanceOrders({id:f.admin.id,role:"ADMIN"},f.provider.id))[0];
  assert.equal(finance.refunded,0); assert.equal(finance.refundDue,30);
});

test("a transfer reference cannot be reused on another case and failed audit writes roll back state", async (t) => {
  const f = await fixture(); const second = await fixture();
  for (const item of [f,second]) {
    await changeRefundCase(item.admin.id,{action:"OPEN",operationId:item.op.id,amountMinor:3000});
    const entry=await db.refundCase.findUniqueOrThrow({where:{operationId:item.op.id}});
    await changeRefundCase(item.admin.id,{action:"DETAILS",caseId:entry.id,version:0,destination:"TEST-DEST-AAA"});
    await changeRefundCase(item.admin.id,{action:"VERIFY",caseId:entry.id,version:1});
    await changeRefundCase(item.admin.id,{action:"APPROVE",caseId:entry.id,version:2});
  }
  const first=await db.refundCase.findUniqueOrThrow({where:{operationId:f.op.id}});
  const other=await db.refundCase.findUniqueOrThrow({where:{operationId:second.op.id}});
  const reference=`TEST-TRANSFER-${f.op.id.toUpperCase()}`;
  assert.equal((await changeRefundCase(f.admin.id,{action:"SEND",caseId:first.id,version:3,reference,evidence:"TEST-EVIDENCE-AAA"})).ok,true);
  assert.equal((await changeRefundCase(second.admin.id,{action:"SEND",caseId:other.id,version:3,reference,evidence:"TEST-EVIDENCE-BBB"})).ok,false);
  assert.equal((await db.refundCase.findUniqueOrThrow({where:{id:other.id}})).status,"APPROVED");
  const trigger=`refund_case_failure_${randomUUID().replaceAll("-","")}`;
  const pg=/^postgres/.test(url);
  if (pg) {
    await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."caseId" = '${first.id}' AND NEW.action = 'COMPLETE' THEN RAISE EXCEPTION 'refund case audit failure'; END IF; RETURN NEW; END $$`);
    await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON "RefundCaseEvent" FOR EACH ROW EXECUTE FUNCTION ${trigger}()`);
  } else await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON RefundCaseEvent WHEN NEW.caseId = '${first.id}' AND NEW.action = 'COMPLETE' BEGIN SELECT RAISE(ABORT, 'refund case audit failure'); END`);
  const drop=async()=>{
    await db.$executeRawUnsafe(pg ? `DROP TRIGGER IF EXISTS ${trigger} ON "RefundCaseEvent"` : `DROP TRIGGER IF EXISTS ${trigger}`);
    if (pg) await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}()`);
  };
  t.after(drop);
  const complete={action:"COMPLETE",caseId:first.id,version:4,verification:"TEST-VERIFY-AAA"};
  assert.equal((await changeRefundCase(f.admin.id,complete)).ok,false);
  assert.equal((await db.refundCase.findUniqueOrThrow({where:{id:first.id}})).status,"SENT_UNVERIFIED");
  assert.equal(await db.refundCaseEvent.count({where:{caseId:first.id,action:"COMPLETE"}}),0);
  await drop();
  assert.equal((await changeRefundCase(f.admin.id,complete)).ok,true);
});
