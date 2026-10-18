import assert from "node:assert/strict";
import { test } from "node:test";
import { createTransferClient } from "../src/server/omise-transfer-client";
const env={OMISE_TEST_SECRET_KEY:"skey_test_fixture",OMISE_API_VERSION:"2019-05-29"};
const expected={amountMinor:10000,recipientId:"recp_test_fixture",operationId:"operation1"};
const transfer={object:"transfer",id:"trsf_test_fixture",livemode:false,amount:10000,currency:"THB",recipient:"recp_test_fixture",metadata:{saan_payout:"operation1"},fee:1869,fee_vat:131,total_fee:2000,net:8000,sent:false,paid:false,deleted:false,failure_code:null};
test("transfer boundary rejects live configuration and unsafe destinations",async()=>{
  assert.throws(()=>createTransferClient({...env,APP_ENV:"production"}));
  assert.throws(()=>createTransferClient({...env,OMISE_TEST_SECRET_KEY:"skey_live_fixture"}));
  let calls=0;const client=createTransferClient(env,async()=>{calls++;throw new Error("unexpected");});
  await assert.rejects(client.create({...expected,recipientId:"recp_live"}));assert.equal(calls,0);
});
test("POST timeout is unknown and never retried, errors do not leak credentials",async()=>{
  let calls=0;const client=createTransferClient(env,async()=>{calls++;throw new Error(env.OMISE_TEST_SECRET_KEY);});
  await assert.rejects(client.create(expected),error=>{assert.ok(error instanceof Error);assert.equal(error.message.includes(env.OMISE_TEST_SECRET_KEY),false);return true;});assert.equal(calls,1);
});
test("transfer must match mode amount destination metadata and fee arithmetic",async()=>{
  for(const patch of [{livemode:true},{amount:10100},{recipient:"recp_test_other"},{metadata:{saan_payout:"wrong"}},{net:9000},{total_fee:2001},{paid:true}]){
    const client=createTransferClient(env,async()=>new Response(JSON.stringify({...transfer,...patch})));
    await assert.rejects(client.retrieve(transfer.id,expected));
  }
});
test("recovery only GETs the transfer list and rejects ambiguous matching records",async()=>{
  for(const records of [[],[transfer],[transfer,{...transfer,id:"trsf_test_other"}]]){
    let calls=0;const client=createTransferClient(env,async(url,options)=>{calls++;assert.equal(options?.method,"GET");assert.match(String(url),/^https:\/\/api.omise.co\/transfers\?/);return new Response(JSON.stringify({object:"list",data:records,total:records.length}));});
    if(records.length===2)await assert.rejects(client.recover(expected));else assert.equal((await client.recover(expected))?.id??null,records.length?transfer.id:null);assert.equal(calls,1);
  }
});
