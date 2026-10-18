# Omise sandbox staging QA — 18 October 2026

## Deployment

- Private URL: `https://iceberg.taile08e5c.ts.net:8443/`.
- Source snapshot: `/home/ice/saan/releases/omise-8da4a3579150`, based on Git HEAD `4a29ba0` plus the reviewed payment worktree files. The owner's unrelated `src/components/visuals.tsx` edit was explicitly excluded and retained locally.
- Image: `saan:omise-8da4a3579150`; identity `sha256:2ef2b8c3dec5bab892802b91a6a283371d46b9ecffbcbc86db6ce5d3e254850c`.
- Pre-deployment backup: `/home/ice/saan/backups/20261018T073229Z-2287485`. Database/uploads remain on home server; no off-machine backup copy.
- Applied additive migration `20261018020000_webhook_inbox`. Existing data/old mock receipts preserved.
- New rotated test key verified against the same account and old successful test charge; transferred through SSH stdin into protected deployment config, never image/Git/chat. Current and rollback environment files both checked as mode 0600.
- Rollback files: `/home/ice/saan/deploy/deployment.env.before-omise-8da4a3579150` and `compose.yml.before-omise-8da4a3579150`. Previous image remains available. Keep the additive migration/history when reverting application code.
- `omise_test` enabled only in allowlisted private staging. Collection mutations deliberately enabled after paused-state checks. Worker profile `payments` running; provider GET and internal authentication checks passed.
- Public webhook flag/profile remain OFF. No public tunnel/domain was configured. Tailscale webcam 443 and Saan 8443 unchanged; gold-api and thai-gold-web remain running.
- Docker production build passed. Existing storage tracing warnings and 12 high dependency audit findings remain release-review work; no broad dependency upgrades made.

## Synthetic browser test

- Order `staging-omise-qa-20261018`, code `QA-OMISE-1810`, owned by existing synthetic admin account acting as buyer; synthetic shop/address/item only.
- Total THB 1,000, deposit THB 300. Browser showed only PromptPay and the test-mode notice.
- Clicking deposit generated `chrg_test_69dro7pk5i5xiofhl2l`; QR and expiry rendered correctly. Durable operation `cmvdigyrk0001s201s00y2fr3` was PENDING; Payment count remained zero, order AWAITING_DEPOSIT.
- Screenshot: ignored local `output/staging/omise-order-qr.png`.
- User marked this exact test charge paid in Omise Dashboard. Without any Saan check-button/internal reconcile call afterward, the scheduled worker changed the operation to SUCCEEDED and the order to AWAITING_PROVIDER, with exactly one Payment row for THB 300.
- Reloaded browser showed “จ่ายมัดจำแล้ว”, “รอร้านยืนยันและนัดวัน”, deposit paid THB 300 and remaining THB 700. Screenshot: ignored `output/staging/omise-order-paid.png`.
- Restarted app and worker, then independently read the order: same charge ID, SUCCEEDED operation, AWAITING_PROVIDER and Payment count still 1. Private HTTPS health passed.
- Post-test server-local backup: `/home/ice/saan/backups/20261018T073912Z-2293047`, including successful sandbox payment and inbox schema. No backup transferred off the home server.

## Full order journey verified

The same synthetic order was continued through the real browser UI, without resetting its state or editing order status directly in SQL:

1. Signed in as `staging-shop` using the allowlisted on-screen test OTP. Pressing acceptance without date/time showed the inline validation error and focused the date field.
2. Selected 19 October 2026 at 09:00 Bangkok time through the Thai calendar/time UI; shop acceptance changed the order to CONFIRMED. Appointment was displayed consistently to buyer and shop.
3. Submitted an explicitly synthetic progress report, then pressed the shop's “แจ้งว่างานเสร็จ”. Order became DONE, retaining only the already-paid THB 300 deposit.
4. Signed back into the synthetic buyer account. The UI requested exactly THB 700. Acceptance generated balance charge `chrg_test_69drrbc7vy8nv6b9jju`, operation `cmvdisakw000ls201bmqb67f9`. While pending, order remained DONE, Payment count remained 1, and no completion/shrine was created.
5. Reloaded and resumed: balance charge identity stayed unchanged; no third operation was created. The user selected Omise Testing → Mark as paid for this exact charge.
6. Without pressing a Saan check button afterward, the scheduled worker finalized the balance. Order became COMPLETED with exactly one deposit and one balance Payment, total THB 1,000, two successful money operations and one linked shrine owned by the buyer. Shop acceptance, delivery and customer-completion events each appeared once.
7. Both buyer and actual shop login showed the completed order and both paid amounts. No further pay/deliver/accept controls remained. The review form became available; no fake public review was submitted.
8. Restarted app and worker; the same completed order, references, Payment count 2 and single shrine/completion event survived. HTTPS health passed. No refund/payout operation was created.

This was an accelerated synthetic workflow: the appointment was in the future but progress/delivery were simulated immediately. No actual service or bank payment occurred. The buyer is the existing synthetic admin account acting as a customer; it does not gain shop-management permission for its own order (shop-route access as buyer correctly returned not found).

### Independent provider reconciliation

After restart, read both original charge IDs with the rotated test key and verified test mode, successful/paid status, THB amount and the original operation `ref_id`:

| Stage | Amount | Provider fee | Fee VAT | Provider net |
|---|---:|---:|---:|---:|
| Deposit | THB 300.00 | THB 4.95 | THB 0.35 | THB 294.70 |
| Balance | THB 700.00 | THB 11.55 | THB 0.81 | THB 687.64 |

These are observed sandbox receipt fields, not Saan commission or a shop payout calculation. Customer total remains THB 1,000. No transfer was initiated.

### Regression and persistence evidence

- Expanded payment/settlement/runtime suites from 28 to 30 tests; all passed on isolated SQLite and home-server `saan_test` PostgreSQL using the deployed application code. New cases cover unpaid balance gating, missing-callback polling, no repeat execution and concurrent finalization producing one payment/shrine/completion event.
- TypeScript and targeted ESLint passed. No production-code change or new image was necessary for this full-order test pass; only tests/documentation changed.
- Screenshots (ignored local files): `output/staging/omise-shop-delivered.png`, `omise-balance-pending.png`, `omise-order-completed.png`, `omise-shop-completed.png`.
- Completed-order backup retained on home server: `/home/ice/saan/backups/20261018T075137Z-2298865`. No off-server backup transfer.

## Scope limits

This verifies sandbox collection, not bank money movement, public callback delivery, automatic refunds or shop payouts. Those provider operations remain unsupported. Expired/unknown charge replacement remains manual; multi-attempt recovery/account namespaces are not implemented.

See [sandbox runbook](OMISE-SANDBOX-RUNBOOK.md) for activation/recovery controls and [payment plan](OMISE-PAYMENT-PLAN.md) for financial gates.

## Cancellation and refund obligations — 18 October 2026

Release `saan:refund-a7c7fa12ae14` adds a durable refund entitlement when a paid Omise PromptPay order is cancelled by its buyer or declined by its shop. This is **not a submitted refund**: the operation is `ACTION_REQUIRED`, references its original Payment, has no provider refund reference/completion time, and leaves the Payment `PAID`. Cancellation and obligation creation commit or roll back together. Repeated cancellation cannot duplicate the obligation.

- Official method limitation: [Omise PromptPay](https://docs.omise.co/promptpay) does not support voids/refunds. The adapter advertises refund/payout capabilities as false; settlement submission and reconciliation are blocked before provider calls. Mock settlement remains available only for original mock receipts under the mock adapter.
- Admin finance separates outstanding refunds from returned amounts. Omise test mode no longer displays mock refund/payout controls. Customer cancellation text no longer claims full reimbursement when some payments remain paid.
- Browser QA used separate synthetic order `staging-omise-refund-qa-20261018`, code `QA-REFUND-1810`, total THB 100, deposit THB 30. Created QR through Saan; charge `chrg_test_69drzhzxg5yl4ha9kna` was marked paid using **Omise Testing**, with no bank transfer. Scheduled worker recorded the deposit without a Saan check action.
- Buyer cancelled through the confirmation UI. Result: CANCELLED, exactly one PAID Payment (THB 30), exactly one REFUND/ACTION_REQUIRED obligation (3,000 satang), empty refund provider reference, null completion time and zero refund-success events. Admin UI displayed outstanding THB 30 and refunded THB 0, with no mock settlement controls.
- Independent authenticated provider GET confirmed test mode, original amount/reference, paid=true, `refundable=false` and `refunded_amount=0`. No Refund or Transfer request was sent.
- Existing completed baseline `staging-omise-qa-20261018` remained COMPLETED with two paid stages totaling THB 1,000, one linked shrine and one completion event; original receipts were reverified after deployment.
- Payment/settlement/runtime suites: **33/33 passed on SQLite and 33/33 on isolated PostgreSQL `saan_test`**, including cancellation races, atomic rollback and unsupported capability guards. Provider/signature/endpoint tests: 14 passed; cancellation wording test: 1 passed. TypeScript, targeted ESLint and production Docker build passed.
- Pre-release backup retained only on home server: `/home/ice/saan/backups/20261018T080654Z-2305072`. No new migration (status is a String). Protected rollback configuration: `/home/ice/saan/deploy/deployment.env.before-refund-a7c7fa12ae14`.
- Restarted app and worker; both cancellation obligation and completed-order baseline passed the same independent database/provider audits again. Post-test backup remains home-only at `/home/ice/saan/backups/20261018T081100Z-2308466`.
- Screenshot proof, ignored local files: `output/staging/omise-refund-cancelled.png` and `output/staging/omise-refund-action-required.png`.

Remaining: agree a supported operational refund route with the provider before live use; implement any approved flow with verified outcome/audit evidence. Do not manually mark these cases refunded, route them through mock, or promise a refund completion date. Marketplace terms, commission/fees and shop payout remain separate gates. Public webhooks remain disabled; private sandbox collection uses polling.

## Refund case rehearsal release — 18 October 2026

- Image `saan:cases-8eb0b14cf2d5`, config digest `sha256:a3f2261396a69ac99b69b7ab90ccf7fe41624af8fc0cd339a6ca91cc4e7daa89`. Additive migration `20261018030000_refund_cases` applied after home-only backup `/home/ice/saan/backups/20261018T120122Z-2366355`. Protected environment and Compose rollback files have suffix `.before-cases-8eb0b14cf2d5`.
- Explicit `REFUND_CASE_TEST_MODE=true` enabled only on private staging. New model is a synthetic operational case; it does not create an Omise refund or bank transfer and does not change paid/refunded financial totals. Production actions always fail closed; deployment default false.
- Browser-tested existing synthetic cancelled order `QA-REFUND-1810`: open full THB 30 case → empty destination inline validation/focus → TEST-DEST details → verify → change destination → review reset → verify again → approve → TEST-TRANSFER and TEST-EVIDENCE identifiers → SENT_UNVERIFIED → TEST-VERIFY → TEST_COMPLETED. Eight audit events, case version 7. No direct database edits were used to advance the case.
- Customer page displayed the test-completed status and explicit no-real-refund disclaimer, without internal destination/evidence identifiers. Light and dark views checked, original dark preference restored.
- Independent database audit confirmed original Payment still PAID, obligation still ACTION_REQUIRED with no provider refund reference/completion time, refund due THB 30 and financial refunded THB 0. Baseline completed THB 1,000 order and original provider receipts also reverified. Restarted app/worker and repeated case audit: same eight events/state, no duplicated case/completion.
- 50 local SQLite integration tests passed; 37 PostgreSQL payment/refund/runtime tests passed, including PostgreSQL-native audit-failure injection, duplicate reference rejection, concurrent completion, stale approval and authorization/privacy checks. TypeScript, targeted ESLint and production build passed.
- The isolated `saan_test` database had an existing webhook table without matching migration history. Verified its column names/types/nullability and expected index, marked that earlier migration applied, then deployed the case migration. Staging history had no such issue and applied only the new migration. No database reset.
- Post-rehearsal backup retained on home server only: `/home/ice/saan/backups/20261018T120351Z-2368994`. No off-server backup copy. No change to public webhook ingress or webcam route.
- Screenshots, ignored local artifacts: `output/staging/refund-case-admin-completed.png`, `refund-case-customer-completed.png`, `refund-case-customer-light.png`.

See [refund case sandbox runbook](REFUND-CASE-SANDBOX.md). Remaining live requirements include actual private destination/evidence collection, independent bank confirmation, partial-amount ledger and reviewer policy. Synthetic TEST_COMPLETED is never evidence of an actual refund.

## Integrated order payout verification — 18 October 2026

Initial integration image `saan:payout-cc8e1a622ecd` applied additive migration `20261018040000_payout_attempts` after home-only backup `/home/ice/saan/backups/20261018T130432Z-2386181`. Payout configuration binds only `staging-provider` to fictitious test-bank recipient `recp_test_69duo9opicxsa4c50q6`; live mode remains rejected.

Actual provider duplicate probes are recorded in OMISE-TRANSFER-CONTRACT-SPIKE.md: same idemp_key/amount and same key/different amount created new transfer identities. App implementation therefore commits one durable dispatch reservation and never repeats an uncertain POST. Standalone probes remain separate from order accounting.

Browser flow on existing synthetic completed order `QA-OMISE-1810`:

1. Pressed payout without policy acceptance: inline error appeared and checkbox received focus.
2. Accepted the explicit sandbox cost policy; submission was rejected. Independent client preflight verified account, recipient and original charges: collection net 98,234 satang, transferable 93,145 and customer-refund reserve 3,000. Database confirmed zero payout operations, so rejection did not dispatch or leave a phantom payout.
3. Created one separately labelled standalone sandbox funding charge `saan-payout-liquidity-20261018`, THB 400, ID `chrg_test_69duwlfciqmi7hdcdcm`. Marked paid in Omise Testing; independent GET confirmed paid/successful. This is synthetic account liquidity, not an order/customer payment or a real bank transfer.
4. Submitted once from admin finance. Created operation `cmvdubgmg0001pj01uj0q09i7`, original transfer `trsf_test_69duwyjhh67hd1451kl`, state PENDING. Payout snapshot: gross 100,000 satang, collection costs 1,766, transfer requested 98,234, actual transfer fee 2,000, bank net 96,234. The zero-commission/shop-cost policy is test-only, explicitly acknowledged, not a commercial agreement.
5. Simulated provider sent: independent GET returned sent=true, paid=false; Saan stayed PENDING with no success event. Restarted app and worker; same operation/reference/state survived.
6. Simulated provider paid on that exact transfer. Without pressing the Saan reconciliation control or invoking its internal endpoint, the scheduled worker finalized SUCCEEDED and created exactly one payout-success event. Original two paid installments, total THB 1,000 and linked shrine were unchanged. Original cancelled-order THB 30 refund remained open and unrefunded.
7. Actual synthetic shop login showed the order's THB 962.34 net, THB 17.66 collection cost and THB 20 transfer cost. Combined paid summary THB 1,962.34 includes an earlier THB 1,000 mock payout. Checked both themes and restored the original dark theme and admin session.

Local SQLite integration suites passed 58 tests; PostgreSQL payment/refund/payout/runtime suites passed 45, including native failure injection after provider acceptance. Four transfer-client fixtures passed. TypeScript, targeted ESLint and production build passed. Fixture failure/recovery tests are separate from actual happy-path provider/browser evidence.

Final review added pause-switch enforcement on new payouts and clarified provider gross/net explanatory text; the final image and restart evidence are recorded below after rollout. Screenshots (ignored local): `output/staging/omise-order-payout-completed.png`, `omise-shop-payout-net.png`, `omise-shop-payout-net-light.png`.

Implementation, pending limitations and restore rules: OMISE-PAYOUT-SANDBOX.md. Real onboarding, fee/tax policy, marketplace acceptance and live activation remain separate gates.


### Final payout rollout verification

- Final image `saan:payout-d8927aa6a651`, config digest `sha256:9e2739e8552eaca843d0e12ad417a8800fa2da6b4f29006f0f6d4eaa6612a3ae` includes the shared mutation-pause guard and clarified shop gross/net copy.
- All 45 PostgreSQL tests passed against the final image; no pending migrations. App and worker replaced, proxy restarted, both HTTPS and localhost health returned ok.
- Independent post-restart database audit retained exactly one successful payout, original transfer ID, 2 original payments, linked shrine and fee snapshots. Provider GET confirmed sent=true, paid=true, livemode=false, net 96234 satang.
- Separate refund case retained version 7 / 8 audit events / TEST_COMPLETED while its financial obligation remained ACTION_REQUIRED, due THB 30, refunded THB 0.
- Admin browser retained successful payout and fee breakdown. Screenshot: ignored `output/staging/omise-order-payout-final.png`.
- Post-flow/pre-final-image backup `/home/ice/saan/backups/20261018T131258Z-2391775` remains on the home server only. No additional financial mutations occurred during final rollout.
