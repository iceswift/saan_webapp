# Omise sandbox operation

Updated 18 October 2026. **Deployed and enabled in private home-server staging.** The rotated key and Omise test account were verified; the reconciliation worker is running. Public webhooks remain disabled. No live collections, refunds or bank payouts are enabled. Evidence: [staging QA](QA-OMISE-STAGING-2026-10-18.md).

## Delivered

- Customer QR/check/resume UI, durable charge reservation and atomic payment/order finalization after provider retrieval.
- `/api/webhooks/omise`: raw-body HMAC, replay window, rotation, 1 MiB streaming limit and durable deduplicated inbox. No raw event bodies or secrets are stored.
- `/api/internal/payment-reconcile`: separate bearer authentication and explicit enablement; retrieves existing provider objects only.
- Restartable `scripts/payment-worker.mjs`: database inbox leases and bounded polling for missing callbacks.
- Additive `ProviderWebhookEvent` migration and optional Compose worker/webhook-only proxy profiles.
- `PAYMENT_MUTATIONS_DISABLED=true`: prevents new Omise submissions while reconciliation remains available.

There is still one reservation per deposit/balance. Expired/uncertain requests cannot automatically generate a replacement; multi-attempt and multi-account routing remain future work. Never reset a reservation merely to retry an uncertain provider request.

## Verification evidence

- Actual sandbox account/capability reads, QR creation, expiry, echoed reference and independent successful payment retrieval: [contract evidence](OMISE-CONTRACT-SPIKE.md).
- Payment/settlement/runtime suites: 28 tests passed on isolated SQLite and the same 28 on home-server **saan_test** PostgreSQL. PostgreSQL fault injection replaces the SQLite trigger rather than skipping its test.
- Source-only PostgreSQL QA used `/tmp/payment-qa-20261018` inside the existing container; deployed application files were not replaced. No database backup was copied off the server.
- Provider/signature/endpoint tests: `npm run test:payment-provider`.
- Deployed browser full-order journey passed: deposit → actual shop login/appointment/progress/delivery → buyer acceptance/balance → scheduled worker completion → exactly two Payments and one shrine → restart persistence. Expanded suites passed 30 tests on each isolated SQLite/PostgreSQL database. See the full-order section of staging QA. Public callback delivery remains unverified; fixture tests do not establish that check.

## Activation sequence

1. Rotate the test key exposed in screenshots, then update protected local/server configuration. Do not send secrets through chat, shell command history or Git. Reconcile historical records before changing provider accounts.
2. Back up using the existing home-server workflow; keep backups there as instructed. Build a new immutable application image through normal deployment procedures.
3. Apply migration `20261018020000_webhook_inbox` through the existing reviewed migration workflow. Never reset staging data. Canonical/generated PostgreSQL schemas are synchronized.
4. Set `PAYMENT_PROVIDER=omise_test`, test key and pinned `OMISE_API_VERSION`; retain `APP_ENV=staging`, `STAGING_TEST_MODE=true` and the synthetic-phone allowlist. Configure a separate random `PAYMENT_WORKER_SECRET` of at least 32 characters.
5. Initially retain `PAYMENT_MUTATIONS_DISABLED=true` and `OMISE_WEBHOOK_ENABLED=false`. Enable `PAYMENT_RECONCILIATION_ENABLED=true` after migration/config verification, then start optional Compose profile `payments`.
6. Deliberately allow mutations for a synthetic browser journey. Create an order, obtain QR, reload/resume the same charge, use Omise Testing → Mark as paid, then verify exactly one Payment/order transition. Do not scan a test QR with a real banking app.

The owner rotated the key; the replacement was sent over SSH stdin into the mode-0600 deployment environment. It is excluded from images, source archives, Git and this document. Do not restore the exposed credential during rollback.

## Public webhook ingress

Current Tailscale HTTPS is private; Omise cannot call it. Polling supports private sandbox validation first.

Optional profile `omise-webhook` provides separate nginx on **127.0.0.1:3102**, permitting only POST `/api/webhooks/omise`. Other paths return 404. It does not expose admin/internal-worker routes or change webcam 443/Saan 8443.

A public TLS domain/tunnel to that listener remains to be selected/configured. Do not tunnel the entire private app on 3100. Configure the test endpoint and Base64 signing secret in Omise, then enable `OMISE_WEBHOOK_ENABLED`. Signing secrets are separate from API keys; `OMISE_WEBHOOK_PREVIOUS_SECRET` supports rotation.

Delivery acceptance: event stored before 2xx; duplicates finalize once; invalid signatures 401; oversized bodies 413; malformed signed JSON 400; storage failure 503. Verify worker restart, callback replay and missing-callback recovery through independent provider GET.

## Recovery and monitoring

Pause charges with `PAYMENT_MUTATIONS_DISABLED=true`. Stop worker for coordinated restore. A database restore does not rewind Omise: reconcile external truth and missing references before resuming. Never blindly replay restored CREATED operations.

Admin finance unresolved operations remain the exception queue. Inspect inbox rows with `processedAt IS NULL`, old `receivedAt`, `attempts` and `error` for mapping/persistence failures. Restrict access and establish retention before public rollout. Missing references require investigation, never a new key or invented paid result.

Rollback retains history and reconciliation access; never delete successful payments or route Omise records through mock. Existing mock operations retain their own adapter identity.

## Remaining financial gates

The adapter rejects REFUND/PAYOUT. Resolve PromptPay's refund limitation and agree marketplace/milestone terms, recipients, commission, fees and payout policy before those real flows. [Full plan](OMISE-PAYMENT-PLAN.md). Tested sandbox collection is not a live marketplace payment system.

## Cancelled paid PromptPay orders

Current refund-obligation release: `saan:refund-a7c7fa12ae14`. Buyer cancellation/shop decline atomically creates one `REFUND` operation per paid Omise PromptPay receipt, status `ACTION_REQUIRED`; this means **not submitted**, not pending provider execution. Never reconcile it as though a refund was sent, set it SUCCEEDED manually, or use mock for an Omise receipt. `Payment.status` remains PAID until a future approved refund flow verifies an actual result. Admin finance shows the outstanding amount separately from returned funds; the original provider charge remains the source of truth.

Refund/payout capability guards reject submission and retrieval for the current Omise adapter. A proposed bank-transfer workaround requires a separately agreed provider/operational procedure, recipient verification and recorded evidence before implementation. The current release sends no refund/transfer requests. See cancellation QA for the THB 30 sandbox proof and regression results.

Rollback to the previous collection image can use protected `deployment.env.before-refund-a7c7fa12ae14`, retaining current data/credentials. ACTION_REQUIRED rows must be preserved; older UI may not label them meaningfully. No schema migration or database restore is required for this release. Keep original Omise receipt identities and never replay collection on rollback.

## Research handoff — external reimbursement

See [refund/settlement design](OMISE-REFUND-SETTLEMENT-DESIGN.md) for the discovered PromptPay exception in the readable public channel terms, the unavailable currently linked terms version, and the separate external-case lifecycle. Unsupported Refund API does not imply a blanket prohibition on other reimbursement methods. This research has not activated that flow, changed the sandbox cases or sent any provider message. Account-specific confirmation questions are prepared in [Thai](OMISE-PROVIDER-QUESTIONS-TH.md).

## Refund case rehearsal

Private staging now also rehearses admin refund cases behind `REFUND_CASE_TEST_MODE=true`. This is separate from the disabled Omise refund adapter: TEST_COMPLETED does not close the financial obligation or mark a payment refunded. Full instructions, rollback and remaining live work: [REFUND-CASE-SANDBOX.md](REFUND-CASE-SANDBOX.md). Migration `20261018030000_refund_cases` is additive. Defaults remain off outside deliberately enabled private testing.

## Transfer probe checkpoint

Standalone sandbox recipient created and verified, but not active; no transfer created. See [OMISE-TRANSFER-CONTRACT-SPIKE.md](OMISE-TRANSFER-CONTRACT-SPIKE.md). Continue with that original recipient after the owner restores their expired dashboard session. Do not repeat reserved API steps or route it into order settlement.

Transfer checkpoint continued successfully after sign-in: original test recipient activated, one THB 100 synthetic transfer reached sent then paid with independent GET/dashboard evidence; observed total fee THB 20 and recipient net THB 80. No order payout integration enabled. Full result and unproven idempotency/recovery gates are in OMISE-TRANSFER-CONTRACT-SPIKE.md.
