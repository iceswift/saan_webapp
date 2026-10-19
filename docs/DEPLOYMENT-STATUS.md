# Deployment status

## Current customer design pass — 20 October 2026

- Source `5e3e176`; image `saan:design-e94359bd8b30`, config digest `sha256:249eb9fe3492082d782dbe7ddd8c5c218fc1a2b53e8a67f0a18db262dfc6ab32`. Home agenda prioritization, private vow preview and customer order tabs. Scope: [DESIGN-REFRESH.md](DESIGN-REFRESH.md).
- Image-only rollout; no schema migration, credential change or payment activation. Rollback environment: `deployment.env.before-design-e94359bd8b30`. App healthy, worker started, loopback and private HTTPS health both returned ok. Existing home-only backup summary remained successful (2026-10-19T15:43:02Z); no backup copied off the server.
- TypeScript, targeted ESLint, two agenda tests and Docker production build passed. Existing storage tracing warnings and 12 npm high-severity audit findings remain; dependency remediation was outside this UI pass.
- Browser checked on the existing synthetic customer order SN-459182: all three tabs, arrow-key focus plus Enter activation, message history, site/payment details and preservation of an unsent draft across tabs. Draft cleared without sending. Light/dark screenshots inspected; original system theme restored. Home private vow shortcut opened the expected owner record. Screenshot proof: ignored `output/staging/design-order-tabs.png` and `design-order-tabs-dark.png`. Dedicated phone-width validation remains for the next design pass.
- Read-only financial audits unchanged: completed Omise payout SUCCEEDED, two payments, one linked shrine and one completion event; outstanding refund remains THB 30, refunded THB 0, case TEST_COMPLETED version 7 with eight audit events.

Previous release evidence follows.

## Current vow-location release — 19 October 2026

- Image **saan:vow-9ef4a8d52ba5**, config digest `sha256:87514aaecc5f6538332dcf44e72d10a0433f6eafac512093f237acccce017329`. Adds optional private map pins to vow creation and existing vow details, editing/removal, and user-initiated Google Maps directions. Runbook: [VOW-LOCATIONS.md](VOW-LOCATIONS.md).
- Migration `20261019010000_vow_location` applied after home-only backup `/home/ice/saan/backups/scheduled/20261019T153605Z-2792791`. Adds nullable Vow lat/lng with an enforced pair/bounds constraint. No automatic geocoding of old records. Image-only rollback config: `deployment.env.before-vow-9ef4a8d52ba5`; retain nullable columns and data during rollback.
- 61 SQLite and 48 final-image PostgreSQL integration tests passed. Explicit PostgreSQL probes rejected partial and out-of-bounds pins in saan_test. TypeScript, targeted ESLint, schema synchronization and production build passed. New tests verify owner-only reads/updates, legacy null pins, coordinate validation/rounding and clearing without loss of vow text.
- Compact-layout browser QA created one explicitly synthetic vow `cmvff8t8n0001ph01wvt3ggr0` (ศาลทดสอบแผนที่ Saan 1910), placed the map-center pin by keyboard without GPS, saved, opened the map, cleared the pin, added it back and reloaded. Independent DB audit confirmed owner and rounded coordinates 13.756393,100.5019; text retained. Directions URL matches those coordinates; no external navigation was performed. Both themes checked and original system theme restored. Screenshots: ignored `output/staging/vow-map-mobile.png` and `vow-map-dark.png`.
- Post-migration/pin backup `/home/ice/saan/backups/scheduled/20261019T154250Z-2798240` passed checksums. Restored into new isolated project `saan-restore-vow-20261019`, loopback 3104, no gateway credentials or worker, mutations disabled. Health passed; all checked source/restore counts, full financial journals, payout snapshots, Vow IDs/coordinates and both upload hashes matched. One Vow restored. Drill containers stopped and files retained on home server only.
- App/worker healthy after deployment and backup restart. Original Omise payout and THB 30 outstanding refund audits unchanged. Existing backup schedule, credentials, private access and live-payment gates unchanged. Previous sections below are historical release evidence.


## Historical appointment-tools release — 19 October 2026

- Image `saan:appointment-ceb8db6d9b8f`, config digest `sha256:ad117f0d79a5a6c471b07bdfddf2c77b6ac85117b3bc4d2f85a1be1a6f45aff9`. Adds customer calendar download and copyable appointment summary, documented in [APPOINTMENT-TOOLS.md](APPOINTMENT-TOOLS.md). Existing operations/backup/payment safeguards retained. No new dependencies or migrations.
- Three calendar tests, TypeScript, targeted ESLint and production build passed. Tests cover UTC conversion, Thai UTF-8 folding, escaped text, stable event UID and invalid dates.
- Deployed-route checks passed: owner 200, anonymous 401, other synthetic shop 404, cancelled appointment 409; calendar time matches the stored UTC appointment, line byte limits pass and response is private/no-store. Temporary synthetic test sessions were removed after verification.
- Customer browser verified on completed scheduled order SN-459182: calendar download and summary-copy success, both themes. Private order-page ownership also rejected access to another test account’s order. Native calendar import across real device apps remains unverified. Screenshots are in ignored `output/staging/appointment-tools-{light,dark}.png`.
- After app/worker replacement, health passed; original Omise payout and refund obligation audits remained unchanged. No real financial action or external share was performed.
- Pre-deployment home-only backup `/home/ice/saan/backups/scheduled/20261019T150455Z-2782128` completed with verified checksums and app/worker restart. Image-only rollback configuration: `deployment.env.before-appointment-ceb8db6d9b8f`. Backup schedule, destinations, flags and credentials unchanged.


## Historical operations release — 19 October 2026

- Current image **saan:operations-1e62e28a6058**, config digest `sha256:66fad6f85bf56407eb07f59b5b77e4f500d73206a3f6af712a31fddff81ee097`. Includes payout reconciliation fairness from 359b4a5 and the new admin monitor. Production build, TypeScript, targeted ESLint and 46 final-image PostgreSQL tests passed. Existing 59 SQLite fairness regressions passed in the preceding source follow-up; this release also passed 14 provider/endpoint tests, the health-state unit test and isolated Linux backup-retention/failure checks. No new database migration.
- `/admin/operations` browser verified in both themes with healthy worker/backup timestamps and the outstanding THB 30 refund. Finance page links to it. Anonymous streamed response redirects to login without financial order data; unauthenticated worker POST returns 401. No external notifications configured.
- Durable private health mount: `/home/ice/saan/data/operations` → `/data/operations`. Worker stale threshold 5 minutes; backup stale threshold 30 hours; unresolved financial queue is shown independently of heartbeat.
- Daily home-only backup installed in a marked ice-user crontab block at **03:00 Asia/Bangkok**. Host timezone verified; cron daemon active; other cron jobs preserved, private pre-change snapshots retained. Keeps 14 successful managed bundles under `/home/ice/saan/backups/scheduled`; manual/historical and failed bundles excluded from automatic pruning. Stops/restarts only previously running Saan app/worker. No off-machine transfer.
- Pre-rollout verified backup `/home/ice/saan/backups/scheduled/20261019T121950Z-2732745`. Restored into isolated project `saan-restore-operations-20261019`, new data directory `/home/ice/saan/restore-operations-20261019/data`, loopback 3103, same new image, no gateway credentials, mutations/reconciliation disabled. Health passed. Source/restore counts matched: 4 users, 1 session, 4 orders, 6 payments, 10 money operations, 1 payout attempt, 1 payment pool, 1 refund case with 8 events, 2 shrines and 20 order events. Full money journals/payout snapshots and both uploaded-file hashes matched. Repeated restore refused a nonempty database, with data unchanged. Drill containers stopped; files retained on home server.
- Post-rollout audits retained original successful transfer `trsf_test_69duwyjhh67hd1451kl`, net THB 962.34, exactly one completion event and 2 original payments. Refund remains ACTION_REQUIRED / due THB 30 / refunded THB 0 despite TEST_COMPLETED case. Protected rollback files have suffix `.before-operations-1e62e28a6058`; retain payout journals and current reconciliation path when rolling back.
- Post-rollout scheduled-runner backup: `/home/ice/saan/backups/scheduled/20261019T122742Z-2742900` passed all checksums and restarted the app/worker successfully, using a minimal cron-like environment.
- Full runbook: [OPERATIONS-MONITORING.md](OPERATIONS-MONITORING.md). Earlier sections below are historical evidence, not a claim that their images are still running.


## Historical payment sandbox release — 18 October 2026

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

## Historical private test release

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

## Historical source-tested follow-up — 19 October 2026

Payout reconciliation batch fairness fixed in source: missing/uncertain results rotate out of the oldest-three batch without releasing reservations or retrying transfers. 59 SQLite and 46 isolated PostgreSQL tests passed, including the starvation regression. PostgreSQL verification used the current image with candidate service/test files mounted into a disposable test container, targeting saan_test only. At that checkpoint this follow-up was not deployed and staging remained on payout-d8927aa6a651. It was subsequently included in the current operations release documented at the top of this file. No staging financial state or settings were changed during the source-only checkpoint.
