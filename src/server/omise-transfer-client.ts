import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { OmiseTestError } from "./omise-test-client";

const money = z.number().int().nonnegative();
const transferSchema = z.object({ object:z.literal("transfer"),id:z.string().regex(/^trsf_test_[a-z0-9]+$/),livemode:z.literal(false),
  amount:money,currency:z.string(),recipient:z.union([z.string(),z.object({id:z.string()})]),metadata:z.record(z.string(),z.unknown()),
  fee:money,fee_vat:money,total_fee:money,net:money,sent:z.boolean(),paid:z.boolean(),deleted:z.boolean(),failure_code:z.string().nullable(),
});
export type TestTransfer = z.infer<typeof transferSchema>;
export type TransferExpectation = {amountMinor:number;recipientId:string;operationId:string};
export interface TransferClient {
  account(): Promise<string>;
  available(): Promise<number>;
  recipient(id:string): Promise<string>;
  chargeNet(id:string,amountMinor:number,key:string): Promise<number>;
  create(expected:TransferExpectation): Promise<TestTransfer>;
  retrieve(id:string,expected:TransferExpectation): Promise<TestTransfer>;
  recover(expected:TransferExpectation): Promise<TestTransfer | null>;
}
export function createTransferClient(env:Record<string,string|undefined> = process.env,transport:typeof fetch=fetch): TransferClient {
  const key=env.OMISE_TEST_SECRET_KEY,version=env.OMISE_API_VERSION;
  if(env.APP_ENV==="production" || !/^skey_test_[A-Za-z0-9]+$/.test(key??"") || !/^\d{4}-\d{2}-\d{2}$/.test(version??"")) throw new OmiseTestError("CONFIGURATION");
  async function request(path:string,body?:Record<string,string>):Promise<unknown>{
    try {
      const response=await transport("https://api.omise.co"+path,{method:body?"POST":"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(15000),
        headers:{Authorization:"Basic "+Buffer.from(key+":").toString("base64"),"Omise-Version":version!,...(body?{"Content-Type":"application/x-www-form-urlencoded"}:{})},body:body?new URLSearchParams(body).toString():undefined});
      if(!response.ok) throw new OmiseTestError("UNKNOWN");
      return await response.json();
    } catch {throw new OmiseTestError("UNKNOWN");}
  }
  function parse(raw:unknown,expected:TransferExpectation){
    const t=transferSchema.safeParse(raw);if(!t.success)throw new OmiseTestError("MISMATCH");const v=t.data;
    if(v.currency.toUpperCase()!=="THB" || v.amount!==expected.amountMinor || (typeof v.recipient==="string"?v.recipient:v.recipient.id)!==expected.recipientId ||
      v.metadata.saan_payout!==expected.operationId || v.total_fee!==v.fee+v.fee_vat || v.net!==v.amount-v.total_fee || (v.paid && (!v.sent || v.deleted || v.failure_code))) throw new OmiseTestError("MISMATCH");
    return v;
  }
  function recipientId(id:string){if(!/^recp_test_[a-z0-9]+$/.test(id))throw new OmiseTestError("CONFIGURATION");}
  return {
    async account(){const v=z.object({object:z.literal("account"),id:z.string().min(1),livemode:z.literal(false)}).parse(await request('/account'));return v.id;},
    async available(){return z.object({object:z.literal("balance"),livemode:z.literal(false),currency:z.string().regex(/^thb$/i),transferable:money}).parse(await request('/balance')).transferable;},
    async recipient(id){recipientId(id);const v=z.object({object:z.literal("recipient"),id:z.literal(id),livemode:z.literal(false),active:z.literal(true),verified:z.literal(true),deleted:z.literal(false),
      bank_account:z.object({livemode:z.literal(false),bank_code:z.literal("test"),account_number:z.string(),name:z.string()})}).parse(await request('/recipients/'+id));
      return createHash('sha256').update(JSON.stringify(v.bank_account)).digest('hex');},
    async chargeNet(id,amountMinor,key){
      if(!/^chrg_test_[a-z0-9]+$/.test(id))throw new OmiseTestError("CONFIGURATION");
      const v=z.object({object:z.literal("charge"),id:z.literal(id),livemode:z.literal(false),amount:z.literal(amountMinor),currency:z.string().regex(/^thb$/i),paid:z.literal(true),status:z.literal("successful"),ref_id:z.literal(key),refunded_amount:z.literal(0),fee:money,fee_vat:money,net:money}).parse(await request('/charges/'+id));
      if(v.net!==v.amount-v.fee-v.fee_vat)throw new OmiseTestError("MISMATCH");return v.net;
    },
    async create(expected){recipientId(expected.recipientId);if(!Number.isSafeInteger(expected.amountMinor)||expected.amountMinor<=2000)throw new OmiseTestError("CONFIGURATION");
      return parse(await request('/transfers',{amount:String(expected.amountMinor),recipient:expected.recipientId,fail_fast:'true',idemp_key:expected.operationId,'metadata[saan_payout]':expected.operationId}),expected);},
    async retrieve(id,expected){if(!/^trsf_test_[a-z0-9]+$/.test(id))throw new OmiseTestError("CONFIGURATION");const t=parse(await request('/transfers/'+id),expected);if(t.id!==id)throw new OmiseTestError("MISMATCH");return t;},
    async recover(expected){
      // A bounded scan can find an original dispatch; absence never permits another POST.
      const matches:TestTransfer[]=[];
      for(let offset=0;offset<1000;offset+=100){
        const list=z.object({object:z.literal("list"),data:z.array(z.unknown()),total:money}).parse(await request(`/transfers?limit=100&offset=${offset}&order=reverse_chronological`));
        for(const raw of list.data){const candidate=z.object({metadata:z.record(z.string(),z.unknown())}).safeParse(raw);if(candidate.success&&candidate.data.metadata.saan_payout===expected.operationId)matches.push(parse(raw,expected));}
        if(offset+100>=list.total)break;
        if(offset===900)throw new OmiseTestError("UNKNOWN");
      }
      if(matches.length>1)throw new OmiseTestError("MISMATCH");return matches[0]??null;
    },
  };
}
