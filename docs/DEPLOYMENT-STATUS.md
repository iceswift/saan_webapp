# Deployment status

## Current payment sandbox release — 18 October 2026

Current image: **saan:payout-d8927aa6a651**, config digest `sha256:9e2739e8552eaca843d0e12ad417a8800fa2da6b4f29006f0f6d4eaa6612a3ae`. Integrated synthetic-shop payouts deployed and verified through the browser, actual Omise test API, automatic worker reconciliation and app/worker replacement. Migration `20261018040000_payout_attempts` applied. 58 SQLite integration tests, 45 PostgreSQL tests and 4 transfer-client tests passed; TypeScript, targeted lint and production build passed. The shared money-mutation pause blocks new payouts while allowing reconciliation.

The completed THB 1,000 order has exactly one successful payout: collection cost 17.66, requested transfer 982.34, transfer cost 20, shop net 962.34. These are sandbox observations, not agreed commercial fees. The separate THB 30 refund remains outstanding despite its completed synthetic case workflow. Latest home-only backup: `/home/ice/saan/backups/20261018T131258Z-2391775`. Protected image-only rollback config: `deployment.env.before-payout-final-d8927aa6a651`. Localhost and private HTTPS health passed after rollout. Live payouts, real refunds and public webhook ingress remain disabled. See [OMISE-PAYOUT-SANDBOX.md](OMISE-PAYOUT-SANDBOX.md).

### Previous refund-case release

Current image: **saan:cases-8eb0b14cf2d5**. Refund-case sandbox workflow deployed and browser verified, including eight audited transitions, destination review reset, customer progress and restart persistence. 50 SQLite integration tests and 37 PostgreSQL payment/refund/runtime tests passed. Migration 20261018030000_refund_cases applied. Post-test home-only backup: /home/ice/saan/backups/20261018T120351Z-2368994. Full instructions in REFUND-CASE-SANDBOX.md. Synthetic case completion does not change financial refunds or send money.

### Previous refund-obligation release


Current image: **saan:refund-a7c7fa12ae14**, image config sha256:383f5c9660f4027fee7f67bc020a507d169685e83a1fc617b11792c57059a713. Adds atomic cancellation/refund obligations (ACTION_REQUIRED, not submitted), truthful outstanding/refunded finance totals and capability guards. THB 30 sandbox cancellation passed through the browser and provider GET; completed THB 1,000 baseline preserved. 33 tests passed on each SQLite/PostgreSQL database, plus 14 provider tests and 1 wording test. Pre-release home-only backup: /home/ice/saan/backups/20261018T080654Z-2305072. No real refund/payout or public webhook enabled. Details in the cancellation section of the QA document.

### Previous collection release evidence

Full shop/customer order journey now verified on the same image: deposit 300 → shop acceptance/appointment/progress/delivery → balance 700 → worker-driven COMPLETED, exactly two payments and one linked shrine, retained across app/worker restart. Expanded regression suites passed 30 tests on SQLite and PostgreSQL. Latest completed-order backup: `/home/ice/saan/backups/20261018T075137Z-2298865`; full evidence is in the QA document below.

The previous collection release ran `saan:omise-8da4a3579150` with Omise test-mode PromptPay collection and a separate reconciliation worker. Public webhook ingress remains disabled. Additive webhook migration applied after server-local backup `/home/ice/saan/backups/20261018T073229Z-2287485`; rotated test credentials are protected and not in the image/source. See [QA-OMISE-STAGING-2026-10-18.md](QA-OMISE-STAGING-2026-10-18.md) and [OMISE-SANDBOX-RUNBOOK.md](OMISE-SANDBOX-RUNBOOK.md). Earlier releases below are historical. No live payment/refund/payout activation.

Updated 2026-10-18. See OPERATIONS.md for architecture and runbook.

## Current private test release

- Image/source: `saan:793d62efe14c` (commit `793d62efe14c`), image ID `sha256:950f392b26716fa9af39a51bd4cc6327220b52c79961e31a3a9499250aa6a4de`. Successful production build, TypeScript and targeted ESLint. 38 isolated integration tests passed.
- Explicit staging mode is enabled for synthetic phones 0800000001 (admin), 0800000002 (customer), 0800000003 (shop). OTP is displayed in the UI; no SMS is sent. Other phones are rejected. See STAGING-TESTING.md. Normal production configuration remains closed to simulated login/payments.
- PostgreSQL migration `20261018010000_mock_receipts` applied; migration drift and database constraints passed on `saan_test`. PostgreSQL concurrent-receipt test exposed and verified a unique-key race fix. Simulated provider receipts now survive process restart in the database.
- Full HTTPS browser workflow passed: synthetic order **SN-459182** (`cmvdbnh300005o5017k24ybs5`) at ฿1,000, deposit ฿300, image/message upload, shop confirmation for 25 October 2026 09:00 Bangkok, progress, completion, final payment ฿700, explicit test review, and admin simulated payout ฿1,000.
- Separate synthetic order **SN-488303** (`cmvdbuiqz0017rz01uwe8rsll`) was paid a ฿300 simulated deposit, cancelled before acceptance and refunded in admin UI. All five simulated money operations showed success. No money moved.
- Recreated the final app container after those flows. Admin session and financial history survived and the browser showed the same successful payout/refund, without new pay actions. Uploaded image was also verified after the previous app replacement.
- Pre-change backup: `/home/ice/saan/backups/20261018T041948Z-2230389`. Post-test backup including persistent provider receipts: `/home/ice/saan/backups/20261018T043208Z-2239166`. Both remain on the home server only.
- Post-test restore drill passed in isolated `saan-restore-testmode` using `/home/ice/saan/restore-testmode/data` on loopback 3101: health returned ok, all PNG hashes matched, 5 provider receipts and 5 successful money operations were restored. Drill containers are stopped; data retained.
- Screenshot proof is kept locally in ignored `output/playwright/staging-finance-after-restart.png`. Detailed QA: QA-STAGING-2026-10-18.md.

## Initial infrastructure verification (earlier release)

- Home server reachable over SSH; existing services inspected read-only.
- PostgreSQL migration, portable image/Compose, stable upload path, database health endpoint and backup/restore scripts implemented.
- No real payment or SMS provider configured. The initial image rejected all payments; the current release permits only explicitly enabled private staging simulation, as described above.
- Production Docker build passed on the home server. Source/image tag: `saan:d58f65e4b281a8bc84420ae84e729e01ba27486d`. Build reported dynamic filesystem tracing warnings and npm dependency audit findings; review before public release.
- Deployed image ID: `sha256:ec99e601f6eb109990806ef09be5af18636b6379c6dd8c8d9e3470dd07a491ea`.
- Live Compose project: `saan-staging`, configuration `/home/ice/saan/deploy`, protected config `deployment.env`, data `/home/ice/saan/data`. Web binds **127.0.0.1:3100 only** through nginx. PostgreSQL has no published host port.
- App and database health checks passed. Home page returned HTTP 200. PostgreSQL initial migration deployed twice without changes. Dedicated `saan_test` database passed migration drift, relation, unique money-key, deletion protection and transaction rollback checks.
- Uploaded a synthetic one-pixel PNG through `saveImage`, created a synthetic user `saan-restore-proof`, recreated the app container and verified persistence.
- Backup `/home/ice/saan/backups/20261018T040014Z-2221189` contains database, uploads, image inventory and SHA256 checksums. It contains only synthetic staging data, not local development data.
- Restored that backup into the **separate** `saan-restore-drill` project using `/home/ice/saan/restore-drill/data` and loopback port 3101. Restored health passed, synthetic user count was 1, and served image matched the original byte-for-byte. A second restore correctly refused the nonempty database. Drill containers are stopped; their data is retained.
- Existing gold-api and thai-gold-web stayed running. The webcam route on Tailscale 443 was not changed.
- Private HTTPS is enabled after the owner ran the sudo Serve command. Verified from the development PC on 2026-10-18: `https://iceberg.taile08e5c.ts.net:8443/api/health` returned `{"status":"ok"}` and the home page returned HTTP 200 with normal TLS certificate validation. Serve status confirms Saan 8443 proxies to loopback 3100 while webcam 443 still proxies to 8081. Access requires membership/access in the tailnet; this is not a public endpoint.
- The initial infrastructure image had no authenticated browser/payment-flow test. These private staging flows are now verified on the current release above. Real SMS, real payments and public launch remain unverified/unconfigured.
- User explicitly chose not to copy backups off the home server on 2026-10-18. No backup was transferred to the development PC. Off-machine copies, scheduling and retention remain unconfigured; same-machine backups do not cover disk/server loss.
- GitHub-hosted Actions blocked by account billing. Local results must be recorded separately.
