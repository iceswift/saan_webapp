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

## Scope limits

This verifies sandbox collection, not bank money movement, public callback delivery, automatic refunds or shop payouts. Those provider operations remain unsupported. Expired/unknown charge replacement remains manual; multi-attempt recovery/account namespaces are not implemented.

See [sandbox runbook](OMISE-SANDBOX-RUNBOOK.md) for activation/recovery controls and [payment plan](OMISE-PAYMENT-PLAN.md) for financial gates.
