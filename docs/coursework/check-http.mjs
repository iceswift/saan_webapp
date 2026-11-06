// Actual built Server Actions and session-backed pages against a new local DB.
// No static action IDs, fabricated identity wrapper or production data.
import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
const directory = path.join(root, 'storage/tests/coursework-http', stamp);
mkdirSync(directory, { recursive: true });
const database = path.join(directory, 'money-test.db');
assert.ok(!existsSync(database), 'Never reuse app or previous test data');
writeFileSync(database, ''); // SQLite engine requires an existing file on this host.
process.env.DATABASE_URL = `file:${database.replaceAll('\\', '/')}`;
const phones = ['0800000002','0800000003','0800000006','0800000007'];
const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL,
  APP_ENV: 'staging', STAGING_TEST_MODE: 'true', STAGING_TEST_PHONES: phones.join(','),
  PAYMENT_PROVIDER: 'mock', PAYMENT_MUTATIONS_DISABLED: 'false', NODE_ENV: 'production',
  ADMIN_PHONES: '', OMISE_TEST_SECRET_KEY: '', OMISE_WEBHOOK_SECRET: '', OMISE_WEBHOOK_ENABLED: 'false',
  OMISE_PAYOUT_TEST_ENABLED: 'false', REFUND_CASE_TEST_MODE: 'false',
  PAYMENT_RECONCILIATION_ENABLED: 'false', PAYMENT_WORKER_SECRET: '',
  OPERATIONS_DIR: path.join(directory,'operations'), UPLOAD_DIR: path.join(directory,'uploads') };
for (const key of Object.keys(env)) if (/OMISE|SECRET/.test(key)) env[key] = '';
const schema = spawnSync(process.execPath, ['node_modules/prisma/build/index.js','db','push','--skip-generate'],
  {cwd: root, env, encoding:'utf8'});
assert.equal(schema.status, 0, `Isolated schema setup must succeed: ${schema.stderr.slice(-1200)}`);
const db = new PrismaClient();
const manifest = JSON.parse(readFileSync(path.join(root,'.next/server/server-reference-manifest.json'),'utf8'));
const actionId = (name) => {
  const candidates=Object.entries(manifest.node).filter(([,value])=>value.exportedName===name);
  assert.equal(candidates.length,1,`One build action for ${name}`);
  return candidates[0][0];
};
const base='http://127.0.0.1:3201';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3201'],
  {cwd:root,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log=''; child.stdout.on('data',b=>{log+=b}); child.stderr.on('data',b=>{log+=b});
const results=[];
const check=async(id,fn)=>{await fn(); results.push({id,result:'PASS'}); console.log(`PASS ${id}`)};
async function action(name,input,cookie='',route='/login') {
  const response=await fetch(base+route,{method:'POST',headers:{'Next-Action':actionId(name),
    'Content-Type':'text/plain;charset=UTF-8','Accept':'text/x-component','Origin':base,
    ...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(input===undefined?[]:[input]),redirect:'manual'});
  const body=await response.text();
  const candidates=body.split('\n').map(line=>{
    const colon=line.indexOf(':'); if(colon<0)return null;
    try{return JSON.parse(line.slice(colon+1))}catch{return null}
  });
  const result=candidates.find(value=>value&&typeof value.ok==='boolean');
  assert.ok(result,`Action ${name} must return a structured result (HTTP ${response.status})`);
  const set=response.headers.getSetCookie().find(value=>value.startsWith('saan_session='));
  return {result,cookie:set?.split(';')[0]??'',status:response.status};
}
async function login(phone) {
  const requested=await action('requestOtp',{phone}); assert.equal(requested.result.ok,true);
  const row=await db.otpCode.findFirstOrThrow({where:{phone},orderBy:{createdAt:'desc'}});
  const verified=await action('verifyOtp',{phone,code:row.code});
  assert.equal(verified.result.ok,true); assert.ok(verified.cookie);
  return verified.cookie;
}
async function assertLoginRedirect(response) {
  if ([303,307,308].includes(response.status)) {
    assert.ok(response.headers.get('location')?.includes('/login'));
    return;
  }
  // App Router may already be streaming the shell when requireUser redirects.
  const html=await response.text();
  assert.equal(response.status,200);
  assert.ok(/NEXT_REDIRECT;replace;\/login(?:\?|;)/.test(html) || /url=\/login(?:\?|["'])/.test(html),
    'A streamed response must carry an explicit login navigation directive');
  assert.equal(html.includes('SYNTHETIC PRIVATE COURSEWORK ADDRESS'),false);
}
try {
  let ready=false;
  for(let i=0;i<90;i++) {
    if(child.exitCode!==null)throw Error('Local test server stopped before readiness');
    try {const r=await fetch(base+'/api/health'); if(r.ok){ready=true;break}} catch{}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(ready,'New loopback test server must become healthy');
  const users=[];
  for(const [i,phone] of phones.entries()) users.push(await db.user.create({data:{phone,
    name:`Course synthetic ${i}`,role:i===1||i===3?'PROVIDER':'CUSTOMER'}}));
  const [buyer,owner]=users;
  const shop=await db.provider.create({data:{userId:owner.id,name:'ร้านสมมติสำหรับทดสอบรายวิชา',kind:'SHOP',
    status:'VERIFIED',areas:'["BKK"]',phone:owner.phone}});
  const otherShop=await db.provider.create({data:{userId:users[3].id,name:'Other synthetic shop',kind:'SHOP',
    status:'VERIFIED',areas:'["BKK"]',phone:users[3].phone}});
  const product=await db.product.create({data:{providerId:shop.id,name:'ศาลสมมติสำหรับทดสอบ',kind:'MODERN',price:1000}});
  const pack=await db.servicePackage.create({data:{providerId:shop.id,type:'BASE',name:'Synthetic base',price:100}});
  const foreign=await db.servicePackage.create({data:{providerId:otherShop.id,type:'BASE',name:'Other base',price:200}});
  const date='2030-01-02';
  const input={productId:product.id,packageIds:[pack.id,pack.id],placeType:'HOME',area:'BKK',
    address:'SYNTHETIC PRIVATE COURSEWORK ADDRESS',preferredDates:[date],note:'SYNTHETIC PRIVATE NOTE'};
  await check('HTTP-01 unauthenticated page and order creation are denied',async()=>{
    const r=await fetch(base+'/orders',{redirect:'manual'}); await assertLoginRedirect(r);
    assert.equal((await action('createInstallOrder',input,'','/new/checkout')).result.ok,false);
    assert.equal(await db.order.count(),0);
  });
  await action('requestOtp',{phone:buyer.phone});
  await check('HTTP-02 invalid login establishes no session',async()=>{
    const row=await db.otpCode.findFirstOrThrow({where:{phone:buyer.phone},orderBy:{createdAt:'desc'}});
    const wrong=row.code==='000000'?'111111':'000000';
    const r=await action('verifyOtp',{phone:buyer.phone,code:wrong});
    assert.equal(r.result.ok,false); assert.equal(r.cookie,''); assert.equal(await db.session.count(),0);
  });
  const buyerCookie=await login(buyer.phone);
  await check('HTTP-03 valid login resolves the seeded buyer and protects its session',async()=>{
    const session=await db.session.findUniqueOrThrow({where:{token:decodeURIComponent(buyerCookie.split('=')[1])}});
    assert.equal(session.userId,buyer.id);
    assert.equal((await fetch(base+'/orders',{headers:{Cookie:buyerCookie},redirect:'manual'})).status,200);
  });
  let orderId;
  await check('HTTP-04 real action persists server totals and deduplicates packages',async()=>{
    const r=await action('createInstallOrder',input,buyerCookie,'/new/checkout'); assert.equal(r.result.ok,true);
    orderId=r.result.data.orderId;
    const order=await db.order.findUniqueOrThrow({where:{id:orderId},include:{items:true,events:true}});
    assert.equal(order.userId,buyer.id); assert.equal(order.total,1100); assert.equal(order.deposit,330);
    assert.equal(order.items.length,2); assert.equal(order.events.length,1); assert.equal(order.status,'AWAITING_DEPOSIT');
    const r2=await fetch(base+`/orders/${orderId}`,{headers:{Cookie:buyerCookie}});
    assert.ok((await r2.text()).includes(input.address));
  });
  await check('HTTP-05 invalid order actions leave the order count unchanged',async()=>{
    const count=await db.order.count();
    for(const bad of [{...input,area:'NBI'},{...input,packageIds:[foreign.id]},
      {...input,preferredDates:['2000-01-01']},{...input,preferredDates:[]}]) {
      assert.equal((await action('createInstallOrder',bad,buyerCookie,'/new/checkout')).result.ok,false);
      assert.equal(await db.order.count(),count);
    }
    await db.providerBlockedDate.create({data:{providerId:shop.id,date}});
    assert.equal((await action('createInstallOrder',input,buyerCookie,'/new/checkout')).result.ok,false);
    assert.equal(await db.order.count(),count);
    await db.providerBlockedDate.deleteMany({where:{providerId:shop.id}});
  });
  await check('HTTP-10 impossible future dates reject without persisted side effects',async()=>{
    const before = [await db.order.count(), await db.orderItem.count(), await db.orderEvent.count()];
    for (const invalid of ['2030-02-30','2031-02-29','2030-04-31','2030-13-01','2030-01-00']) {
      const r = await action('createInstallOrder',{...input,preferredDates:[invalid]},buyerCookie,'/new/checkout');
      assert.equal(r.result.ok,false,`Reject impossible calendar date ${invalid}`);
      assert.deepEqual([await db.order.count(),await db.orderItem.count(),await db.orderEvent.count()],before);
    }
  });
  const outsiderCookie=await login(users[2].phone);
  const providerCookie=await login(owner.phone);
  const otherProviderCookie=await login(users[3].phone);
  await check('HTTP-06 unrelated session cannot read private order fields or confirm',async()=>{
    for(const cookie of [outsiderCookie,otherProviderCookie]) {
      const r=await fetch(base+`/orders/${orderId}`,{headers:{Cookie:cookie}}); const html=await r.text();
      assert.ok([200,404].includes(r.status)); assert.equal(html.includes(input.address),false);
      assert.equal(html.includes(input.note),false);
      assert.equal((await action('confirmOrder',{orderId,scheduledAt:date+'T10:00:00+07:00'},cookie,'/provider')).result.ok,false);
    }
    assert.equal((await db.order.findUniqueOrThrow({where:{id:orderId}})).status,'AWAITING_DEPOSIT');
  });
  await check('HTTP-07 mock deposit advances once and enables the owning shop',async()=>{
    for(let i=0;i<2;i++) assert.equal((await action('payDeposit',{orderId,method:'PROMPTPAY'},buyerCookie,`/orders/${orderId}`)).result.ok,true);
    assert.equal(await db.payment.count({where:{orderId,status:'PAID'}}),1);
    assert.equal((await db.order.findUniqueOrThrow({where:{id:orderId}})).status,'AWAITING_PROVIDER');
  });
  await check('HTTP-08 blocked confirmation rolls back then open date confirms once',async()=>{
    await db.providerBlockedDate.create({data:{providerId:shop.id,date}});
    const beforeEvents=await db.orderEvent.count({where:{orderId}});
    const beforeNotifications=await db.notification.count();
    const confirmation={orderId,scheduledAt:date+'T10:00:00+07:00'};
    assert.equal((await action('confirmOrder',confirmation,providerCookie,'/provider')).result.ok,false);
    assert.equal(await db.orderEvent.count({where:{orderId}}),beforeEvents);
    assert.equal(await db.notification.count(),beforeNotifications);
    assert.equal((await db.order.findUniqueOrThrow({where:{id:orderId}})).scheduledAt,null);
    await db.providerBlockedDate.deleteMany({where:{providerId:shop.id}});
    assert.equal((await action('confirmOrder',confirmation,providerCookie,'/provider')).result.ok,true);
    assert.equal((await action('confirmOrder',confirmation,providerCookie,'/provider')).result.ok,false);
    assert.equal(await db.orderEvent.count({where:{orderId}}),beforeEvents+1);
    assert.equal((await db.order.findUniqueOrThrow({where:{id:orderId}})).status,'CONFIRMED');
    assert.ok((await (await fetch(base+`/orders/${orderId}`,{headers:{Cookie:buyerCookie}})).text()).includes(input.address));
  });
  await check('HTTP-09 logout deletes session and replayed cookie is denied',async()=>{
    const token=decodeURIComponent(buyerCookie.split('=')[1]);
    assert.equal((await action('logout',undefined,buyerCookie,'/account')).result.ok,true);
    assert.equal(await db.session.findUnique({where:{token}}),null);
    const r=await fetch(base+`/orders/${orderId}`,{headers:{Cookie:buyerCookie},redirect:'manual'});
    await assertLoginRedirect(r);
  });
  console.log(`RESULT ${results.length} passed, 0 failed, 0 skipped`);
} catch(error) {
  results.push({id:'execution',result:'FAIL',error:String(error.message)});
  console.error(`FAIL ${error.message}`); process.exitCode=1;
} finally {
  child.kill();
  await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);setTimeout(resolve,5000)});
  await db.$disconnect();
  // The raw server log may contain test-code values: retain only a summary.
  const report={checkedAt:new Date().toISOString(),baseURL:base,isolatedDatabase:database,
    buildManifestHash:(await import('node:crypto')).createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
    sourceIdentity:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    sourceFiles:Object.fromEntries(['next.config.ts','postcss.config.mjs','package.json','package-lock.json',
      'src/server/actions/auth.ts','src/server/actions/orders.ts','src/server/actions/provider.ts',
      'src/server/auth.ts','src/server/queries.ts','src/server/provider-order-service.ts','prisma/schema.prisma']
      .filter(name=>existsSync(path.join(root,name))).map(name=>[name,
        createHash('sha256').update(readFileSync(path.join(root,name))).digest('hex')])),
    transport:'Real built Next.js actions and pages; action IDs resolved from this build only',
    paymentProvider:'mock',results,serverStarted:log.includes('Ready'),
    diagnosticErrors:log.split('\n').filter(line=>/Error:|error:|PrismaClient|Invalid|digest:/.test(line)).map(line=>line.replace(/\b\d{6}\b/g,'[redacted]')).slice(-12),
    limitations:['No browser UI execution claimed','No real money or SMS','No teammate execution claimed']};
  writeFileSync(path.join(root,process.env.COURSEWORK_HTTP_REPORT ?? `docs/coursework/evidence/http-${stamp}.json`),JSON.stringify(report,null,2));
}
