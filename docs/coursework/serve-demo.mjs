// View only the synthetic database created by check-http.mjs on loopback.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const report=JSON.parse(readFileSync(path.join(root,'docs/coursework/evidence/http-2026-11-05.json'),'utf8'));
const database=path.resolve(report.isolatedDatabase);
assert.ok(database.startsWith(path.join(root,'storage/tests/coursework-http')+path.sep));
assert.equal(path.basename(database),'money-test.db');
const env={...process.env,DATABASE_URL:`file:${database.replaceAll('\\','/')}`,APP_ENV:'staging',
  STAGING_TEST_MODE:'true',STAGING_TEST_PHONES:'0800000002,0800000003,0800000006,0800000007',
  PAYMENT_PROVIDER:'mock',PAYMENT_MUTATIONS_DISABLED:'false',NODE_ENV:'production',ADMIN_PHONES:'',
  PAYMENT_RECONCILIATION_ENABLED:'false',OMISE_WEBHOOK_ENABLED:'false',
  OMISE_PAYOUT_TEST_ENABLED:'false',REFUND_CASE_TEST_MODE:'false',
  UPLOAD_DIR:path.join(path.dirname(database),'uploads'),OPERATIONS_DIR:path.join(path.dirname(database),'operations')};
for(const key of Object.keys(env))if(/OMISE|SECRET/.test(key))env[key]='';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3201'],
  {cwd:root,env,stdio:'inherit',windowsHide:true});
process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
child.on('exit',code=>{process.exitCode=code??0});
