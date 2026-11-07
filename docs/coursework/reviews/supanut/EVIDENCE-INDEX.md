# Supanut Sprint 1 Review Evidence Index (`EVIDENCE-INDEX.md`)

- **Reviewer:** Supanut Sopha (`67070503441`, GitHub: `@ikmie`)
- **Teammate / Repository Owner:** Suwiwat Sinsomboon (`67070503444`, GitHub: `@iceswift`)
- **Course:** CPE 334 Software Engineering — Project Deliverable 1 (Sprint 1)
- **Target Repository:** `https://github.com/iceswift/saan_webapp`
- **Related Issues:** `Refs #4, #5, #8`

---

## 1. Revision Provenance (Tested Revision vs. Upload Revision)

Per the evidence-upload protocol, **the tested source revision and the evidence-upload commit are separate facts**:

| Fact | Revision / Timestamp | Notes |
|---|---|---|
| **Actual Tested Source Revision** | `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949`) | *"Prepare runtime support and launch inventory; reject superseded OTP reuse"*. All automated tests, build checks, headless Chrome CDP journeys, screenshots, and Server Action boundary probes in this directory were executed against `8492949` on `2026-11-06` (`Asia/Bangkok`, `UTC+07:00`). |
| **External Report Cross-Checked** | 27-page PDF (`index.pdf`, inspected `2026-11-07T00:50+07:00`) | Cross-checked against `8492949` in Section 4 of [`REQUIREMENTS-FINDINGS.md`](./REQUIREMENTS-FINDINGS.md) before `@ikmie` posted comments on Issues `#4`, `#5`, and `#8` (`2026-11-06T18:06Z–18:11Z`, i.e., `2026-11-07T01:06–01:11+07:00`). |
| **Original Local Evidence Commit** | `17875dfc746815e1e7f5d285793e59ba94fbb8a2` (`17875df`) | Committed locally on Supanut's `main` branch at `2026-11-07T01:26:21+07:00` (parent `8492949`). All 15 files from `17875df` (`6` Markdown documents and `9` PNG screenshots) are preserved **byte-for-byte intact** in this upload. |
| **Upload Branch Base (`origin/main`)** | `6e586f6130d9ff0c29e66e7b7403c87b594062d2` (`6e586f6`) | Current `origin/main` (*"Merge pull request #13 from iceswift/codex/kanban-status"*), checked out into an isolated Git worktree on branch `review/supanut-sprint1-evidence` on `2026-11-07` solely to publish the missing evidence without modifying application or test code. No test result from `8492949` is relabeled as a run on `6e586f6` or `9377577`. |

> **Note on Links Inside Unmodified Files:** Because [`REVIEW-SUMMARY.md`](./REVIEW-SUMMARY.md) and [`TEST-RESULTS.md`](./TEST-RESULTS.md) are kept byte-for-byte intact from local commit `17875df`, inline links inside those two files retain the local workspace URI prefix (`file:///d:/saan_webapp/docs/coursework/reviews/supanut/...`). Use the repository-relative links in Section 2 below to open every document, screenshot, and raw log directly on GitHub.

---

## 2. Artifact-to-Issue Mapping (`#4`, `#5`, `#8`)

### 2.1 Review Documents (Preserved Intact from `17875df`, Plus This Index)

| Artifact | Mapped Issue(s) | Tested Commit | Provenance & Contents |
|---|---|---|---|
| [`EVIDENCE-INDEX.md`](./EVIDENCE-INDEX.md) | `#4`, `#5`, `#8` | `8492949` (uploaded on base `6e586f6`) | Added during the `2026-11-07` evidence upload to map all 23 files to Issues `#4`, `#5`, and `#8`, separate tested revision from upload commit, and document performer attribution and missing items. |
| [`REVIEW-SUMMARY.md`](./REVIEW-SUMMARY.md) | `#4`, `#5`, `#8` | `849294959eeadd6ef88a8c8110c1ba3674b57925` | Executive summary of the `2026-11-06` verification run, environment metadata, disclosure of absent commits (`7b8ee93`, `846b532`, `f96e64c`), summary of checks, and principal findings (`DEF-001`–`DEF-005`). |
| [`REQUIREMENTS-FINDINGS.md`](./REQUIREMENTS-FINDINGS.md) | `#4`, `#8` | `849294959eeadd6ef88a8c8110c1ba3674b57925` | **Primary Issue #4 & #8 deliverable:** Full traceability review of `FR-01`–`FR-04`, `BR-01`–`BR-06`, `NFR-01`–`NFR-04`, `AC-01`–`AC-12`, `DEC-02` signed-in buyer policy, open boundary probes (`3.9.1`–`3.9.4`), and multi-tier build/assertion analysis (`BLD-AC-01`–`03`, service vs. HTTP vs. UI). |
| [`TEST-RESULTS.md`](./TEST-RESULTS.md) | `#5`, `#8` | `849294959eeadd6ef88a8c8110c1ba3674b57925` | **Primary Issue #5 & #8 deliverable:** 9-column execution table covering static/build checks (`AUTO-01`–`03`), integration/unit suites (`AUTO-04`–`05`), disclosed `NOT RUN` scripts (`AUTO-06`–`08`), 11 browser UI sub-cases (`E2E-01A`–`05B`), and 4 boundary probes (`BND-01`–`04`). |
| [`DEFECT-REPORTS.md`](./DEFECT-REPORTS.md) | `#4`, `#5`, `#8` | `849294959eeadd6ef88a8c8110c1ba3674b57925` | Reproducible defect and boundary reports: `DEF-001` (impossible calendar dates `2027-02-31`, linked to Issue `#6`), `DEF-002` (concurrent duplicate `createInstallOrder` submissions, Issue `#7`), `DEF-003` (stale product/provider eligibility at deposit payment, Issue `#7`), `DEF-004` (`runtime-policy.ts` under `next start`), and `DEF-005` (unpublished coursework baseline commits, Issue `#2`). |
| [`PEER-REVIEW-PREPARATION.md`](./PEER-REVIEW-PREPARATION.md) | `#4`, `#8` | `849294959eeadd6ef88a8c8110c1ba3674b57925` | Concrete code-review questions and verification checklist prepared for Supanut's peer review of Suwiwat's changes. |
| [`HUMAN-VERIFICATION-CHECKLIST.md`](./HUMAN-VERIFICATION-CHECKLIST.md) | `#4`, `#5`, `#8` | `849294959eeadd6ef88a8c8110c1ba3674b57925` | Step-by-step manual spot-check guide (`HV-01`–`HV-09`) and oral-defense notes. Personal repeat result/date/signature fields remain **blank (unrecorded)** pending Supanut's manual completion. |

### 2.2 Browser Journey Screenshots (Preserved Intact from `17875df`, Audited Safe)

All 9 screenshots were captured on `2026-11-06` (`23:47–23:48 +07:00`) on commit `849294959eeadd6ef88a8c8110c1ba3674b57925` against isolated disposable SQLite database `file:D:/saan_webapp/storage/review-supanut/review.db` (`PAYMENT_PROVIDER=mock`) using synthetic seeded accounts only. Zero OTP codes, session cookies, `.env` values, or personal browser data appear in any image.

| Screenshot File | Mapped Issue(s) | Test ID(s) | Captured Scene |
|---|---|---|---|
| [`screenshots/01-customer-order-awaiting-deposit.png`](./screenshots/01-customer-order-awaiting-deposit.png) | `#5` | `E2E-01A` | Customer (`0800000002`) order detail `SN-249303` immediately after UI checkout (`AWAITING_DEPOSIT`, `total = ฿14,400`, 30% `deposit = ฿4,320`, `โหมดทดสอบ ยังไม่มีการตัดเงินจริง`). |
| [`screenshots/02-customer-deposit-paid-awaiting-provider.png`](./screenshots/02-customer-deposit-paid-awaiting-provider.png) | `#5` | `E2E-01B` | Customer order detail `SN-249303` after mock deposit payment (`AWAITING_PROVIDER`, `รอร้านยืนยันและนัดวัน`, `มัดจำ 30% • จ่ายแล้ว ฿4,320`). |
| [`screenshots/03-provider-order-confirmed.png`](./screenshots/03-provider-order-confirmed.png) | `#5` | `E2E-01C` | Owning Verified Shop A (`0800000003`) order detail after confirming appointment `2026-11-10 09:00` (`CONFIRMED`, `รับงานแล้ว เตรียมไปทำงาน · นัด อ. 10 พ.ย. 09:00 น.`). |
| [`screenshots/04-customer-reloaded-confirmed-order.png`](./screenshots/04-customer-reloaded-confirmed-order.png) | `#5` | `E2E-01D` | Customer (`0800000002`) order detail `SN-249303` after re-login and full cache-ignoring browser reload (`ร้านนัดเข้างาน อังคาร 10 พ.ย. 09:00 น.`). |
| [`screenshots/05-provider-blocked-date-rejection.png`](./screenshots/05-provider-blocked-date-rejection.png) | `#5`, `#4` | `E2E-02A` | Verified Shop A Buddhist Era (`พฤศจิกายน 2569`) calendar sheet on `SN-100002` showing shop-blocked dates `18`, `19`, `20` struck through (`aria-disabled="true"`, `วันที่ขีดฆ่า ร้านไม่รับงาน`). |
| [`screenshots/06-ownership-restriction-404.png`](./screenshots/06-ownership-restriction-404.png) | `#5`, `#4`, `#8` | `E2E-03A` | Unrelated customer (`0800000009`) visiting `/orders/cmw57jowo0005j6x83jbom9rn` and receiving the `ไม่พบหน้านี้` 404 state with zero private address/phone/note leakage. |
| [`screenshots/07-logout-protected-redirect.png`](./screenshots/07-logout-protected-redirect.png) | `#5` | `E2E-04` | Revisiting protected `/orders/cmw57jowo0005j6x83jbom9rn` after `ออกจากระบบ`, redirected (`307`) to `/login?next=%2Forders%2Fcmw57jowo0005j6x83jbom9rn`. |
| [`screenshots/08-usability-validation-focus.png`](./screenshots/08-usability-validation-focus.png) | `#5` | `E2E-05A` | Validate-on-press on incomplete `/new/checkout`: active primary button, Thai `FieldHint` error (`กรุณาเลือกวันที่ต้องการ`), and automatic focus on `#date`. |
| [`screenshots/09-usability-narrow-large-text.png`](./screenshots/09-usability-narrow-large-text.png) | `#5` | `E2E-05B` | Narrow mobile viewport (`360×740`) with `.text-large` (`19px` root font, `57px` date button height, zero horizontal overflow). |

### 2.3 Retained Raw Automated Logs & Structured Evidence (`2026-11-06` Run on `8492949`)

These raw logs were retained by Antigravity during the `2026-11-06` execution on `849294959eeadd6ef88a8c8110c1ba3674b57925` and are included verbatim (audited free of credentials/tokens/OTPs) to back the counts and build outcomes cited in Issue `#8` and [`TEST-RESULTS.md`](./TEST-RESULTS.md):

| Log / Data File | Mapped Issue(s) | Test ID(s) | Source & Verbatim Contents |
|---|---|---|---|
| [`logs/typegen-and-typecheck-2026-11-06-8492949.log`](./logs/typegen-and-typecheck-2026-11-06-8492949.log) | `#8` | `AUTO-01`, `AUTO-02` | Raw task log (`task-79.log`, `2026-11-06`): boolean `.env == .env.example` hash check (`True`), `npx next typegen` (`✓ Types generated successfully`), and `npm run typecheck` (`tsc --noEmit`, 0 errors). |
| [`logs/test-integration-2026-11-06-8492949.log`](./logs/test-integration-2026-11-06-8492949.log) | `#8`, `#4` | `AUTO-04` | Raw task log (`task-83.log`, `2026-11-06`): `npm run test:integration` (`node scripts/test-integration.mjs` against `file:D:/saan_webapp/storage/tests/ci/money-test.db`) — **65 tests, 65 pass, 0 fail** (`9714.9134 ms`). |
| [`logs/next-build-2026-11-06-8492949.log`](./logs/next-build-2026-11-06-8492949.log) | `#8` | `AUTO-03` | Raw task log (`task-87.log`, `2026-11-06`): `npm run build` (`Next.js 16.4.5 (Turbopack)`) — compiled in `5.5s`, TypeScript `8.1s`, `44/44` static pages generated, route manifest, and 3 dynamic `fs` tracing warnings in `src/server/storage.ts`. |
| [`logs/css-chunks-2026-11-06-8492949.log`](./logs/css-chunks-2026-11-06-8492949.log) | `#8` | `AUTO-03` | Verbatim command capture (`2026-11-06T23:35:03+07:00`) listing emitted `.next/static/chunks/*.css` byte lengths, including `411x_a1wcisvl.css` (`134,510` bytes). |
| [`logs/unit-tests-2026-11-06-8492949.log`](./logs/unit-tests-2026-11-06-8492949.log) | `#8` | `AUTO-05` | Verbatim command capture (`2026-11-06T23:35:23+07:00`) of the 7 unit/policy test files — **34 tests, 34 pass, 0 fail** (`1208.7472 ms`). |
| [`logs/boundary-probe-2026-11-06-8492949.log`](./logs/boundary-probe-2026-11-06-8492949.log) | `#4`, `#8` | `E2E-03C`, `BND-01`, `BND-03` | Verbatim command capture (`2026-11-06T23:36:41+07:00`, exit code `0`) of `verify-section3-boundaries.ts` against `money-test.db`, asserting `getOrder` ownership (`CQ-04` equivalent), `OrderItem` price snapshot immutability (`CQ-03` equivalent), `2027-02-31` regex vs. `parseYMD`, and deposit payment after `Product.active = false`. |
| [`logs/browser-review-evidence-2026-11-06-8492949.json`](./logs/browser-review-evidence-2026-11-06-8492949.json) | `#5`, `#4` | `E2E-01A`–`05B`, `BND-01`, `BND-02`, `BND-04` | Structured JSON telemetry (`2026-11-06T16:47:13.506Z`–`16:48:36.879Z`) recorded by the headless Chrome CDP runner against `file:D:/saan_webapp/storage/review-supanut/review.db`, including before/after row states for blocked-day rejection (`SN-100002`), ownership 404/forbidden probes, session counts across logout (`1 -> 0`), and Server Action boundary responses. |

---

## 3. Command, Result, and Performer Attribution Matrix

| Check / Test ID | Related Issue(s) | Tested Commit | Command / Action | Recorded Result | Performer Attribution |
|---|---|---|---|---|---|
| `AUTO-01` | `#8` | `8492949` | `npx next typegen` | **PASS** (`0` errors) | AI-assisted execution in Antigravity on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#8`. Personal manual repeat in `HUMAN-VERIFICATION-CHECKLIST.md`: **unrecorded**. |
| `AUTO-02` | `#8` | `8492949` | `npm run typecheck` (`tsc --noEmit`) | **PASS** (`0` errors) | AI-assisted execution in Antigravity on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#8`. Personal manual repeat (`HV-02`): **unrecorded**. |
| `AUTO-03` | `#8` | `8492949` | `npm run build` (`next build`, Turbopack) + inspect `.next/static/chunks/*.css` | **PASS** (`44/44` static pages; `411x_a1wcisvl.css` `134,510` bytes) | AI-assisted execution in Antigravity on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#8`. Personal manual repeat: **unrecorded**. |
| `AUTO-04` | `#8`, `#4` | `8492949` | `npm run test:integration` (`node scripts/test-integration.mjs`) | **PASS** (`65/65` pass, `0` fail, `9714.91 ms`) | AI-assisted execution in Antigravity on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#8`. Personal manual repeat (`HV-02`): **unrecorded**. |
| `AUTO-05` | `#8` | `8492949` | `node --conditions=react-server --import tsx --test tests/auth-action.test.ts tests/omise-adapter.test.ts tests/payment-guard.test.ts tests/production-env.test.ts tests/runtime-policy.test.ts tests/security-review.test.ts tests/thai-date.test.ts` | **PASS** (`34/34` pass, `0` fail, `1208.75 ms`) | AI-assisted execution in Antigravity on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#8`. Personal manual repeat: **unrecorded**. |
| `AUTO-06` | `#8` | `8492949` | `node docs/coursework/check-css.mjs` | **NOT RUN** (script absent on `8492949`; CSS verified directly in `AUTO-03`) | Checked by AI-assisted session on `8492949` (`2026-11-06`); disclosed by `@ikmie` on Issue `#8`. |
| `AUTO-07` | `#8`, `#5` | `8492949` | `node docs/coursework/check-http.mjs` | **NOT RUN** (script absent on `8492949`; HTTP/UI actions verified via CDP in `E2E-01`–`05` & `BND-01`–`04`) | Checked by AI-assisted session on `8492949` (`2026-11-06`); disclosed by `@ikmie` on Issue `#8`. |
| `AUTO-08` | `#8` | `8492949` | `tests/coursework-queries.integration.test.ts` (`CQ-01`–`CQ-04`) | **NOT RUN** (file absent on `8492949`; equivalent assertions run in `E2E-03C`) | Checked by AI-assisted session on `8492949` (`2026-11-06`); disclosed by `@ikmie` on Issue `#8`. |
| `E2E-01A`–`01D` | `#5` | `8492949` | Headless Chrome CDP UI journey (`npm run dev`, `review.db`, `PAYMENT_PROVIDER=mock`): customer checkout (`SN-249303`, `฿14,400` / `฿4,320`) -> mock deposit -> Shop A confirm (`2026-11-10 09:00`) -> customer reload | **PASS** (screenshots `01`–`04`) | AI-assisted execution via headless Chrome CDP on Supanut's PC (`2026-11-06`); inspected & summarized by `@ikmie` on Issue `#5`. Personal manual repeat (`HV-03`, `HV-04`, `HV-06`): **unrecorded**. |
| `E2E-02A`–`02B` | `#5`, `#4` | `8492949` | Shop A blocked-date UI check (`2026-11-18` struck through) + `confirmOrder` Server Action with `2026-11-18T00:30:00+07:00` (`2026-11-17T17:30:00Z`) | **PASS** (rejected with Thai error; zero partial writes; screenshot `05`) | AI-assisted execution via headless Chrome CDP on Supanut's PC (`2026-11-06`); summarized by `@ikmie` on Issues `#4` & `#5`. Personal manual repeat (`HV-05`): **unrecorded**. |
| `E2E-03A`–`03C` | `#5`, `#4`, `#8` | `8492949` | Unrelated buyer (`0800000009`) & unrelated shop (`0800000005`) 404/forbidden probes + `verify-section3-boundaries.ts` (`getOrder` null check & catalog price-edit snapshot persistence) | **PASS** (404 + forbidden; zero private leakage; snapshot preserved; screenshot `06`) | AI-assisted execution via headless Chrome CDP & `tsx` script on Supanut's PC (`2026-11-06`); summarized by `@ikmie` on Issues `#4`, `#5`, `#8`. Personal manual repeat (`HV-07`): **unrecorded**. |
| `E2E-04` | `#5` | `8492949` | Click `ออกจากระบบ` (`Session` count `1 -> 0`) and revisit `/orders/cmw57jowo0005j6x83jbom9rn` | **PASS** (`307` redirect to `/login?next=...`; screenshot `07`) | AI-assisted execution via headless Chrome CDP on Supanut's PC (`2026-11-06`); summarized by `@ikmie` on Issue `#5`. Personal manual repeat (`HV-08`): **unrecorded**. |
| `E2E-05A`–`05B` | `#5` | `8492949` | Validate-on-press on `/new/checkout` (`1280×840`) + `.text-large` mobile geometry check (`360×740`) | **PASS** (focus `#date`, `19px` root font, `57px` control height, no horizontal overflow; screenshots `08`–`09`) | AI-assisted execution via headless Chrome CDP on Supanut's PC (`2026-11-06`); summarized by `@ikmie` on Issue `#5`. Personal manual repeat (`HV-09`): **unrecorded**. |
| `BND-01` | `#4`, `#5` | `8492949` | Direct `createInstallOrder` Server Action POST with `preferredDates: ["2027-02-31"]` | **FAIL (`DEF-001`)** — accepted and persisted `["2027-02-31"]` on `8492949` (subsequently addressed on `main` in PR `#11` / `9377577`) | AI-assisted boundary probe on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#4`. Personal manual repeat: **unrecorded**. |
| `BND-02` | `#4`, `#5` | `8492949` | Toggle `Product.active = false` while `/new/checkout` is open, then submit `createInstallOrder` | **PASS** — rejected with `"ไม่พบศาลที่เลือก หรือร้านปิดขายแล้ว"` | AI-assisted boundary probe on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#4`. Personal manual repeat: **unrecorded**. |
| `BND-03` | `#4` | `8492949` | Toggle `Product.active = false` after `AWAITING_DEPOSIT` order creation, then invoke `runCustomerPayment` (`PAYMENT_DEPOSIT`) | **Boundary Documented (`DEF-003`)** — deposit succeeded (`AWAITING_PROVIDER`) | AI-assisted boundary probe on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#4`. Personal manual repeat: **unrecorded**. |
| `BND-04` | `#4`, `#5` | `8492949` | Two concurrent `createInstallOrder` POST requests with duplicate `packageIds: [pkgId, pkgId]` | **Partial / `DEF-002`** — `packageIds` deduplicated (`2` items, `฿14,400`), but two separate unpaid `AWAITING_DEPOSIT` orders (`SN-175514`, `SN-749305`) created | AI-assisted boundary probe on Supanut's PC (`2026-11-06`); reported by `@ikmie` on Issue `#4`. Personal manual repeat: **unrecorded**. |
| **Requirements & Report Audit** | `#4`, `#8` | `8492949` + 27-page `index.pdf` | Source inspection of `src/server/**`, `prisma/schema.prisma`, `tests/**`, and cross-check against Report Parts A–F | **Completed** (`REQUIREMENTS-FINDINGS.md` Sections 2–5) | AI-assisted code/report comparison reviewed and posted by Supanut Sopha (`@ikmie`) on Issues `#4`, `#5`, and `#8` (`2026-11-06T18:06Z–18:11Z`). |

---

## 4. Missing or Unrecorded Artifacts and Locations Checked

| Item | Status | Locations Checked on Supanut's Computer | Explanation |
|---|---|---|---|
| `docs/coursework/check-css.mjs`, `docs/coursework/check-http.mjs`, `docs/coursework/BUILD-CONTRACT.md`, `tests/coursework-queries.integration.test.ts` (execution outputs on `8492949`) | **Absent on `8492949` during the `2026-11-06` run** (`NOT RUN` by filename) | `D:\saan_webapp\docs\coursework\`, `D:\saan_webapp\tests\`, `git log --all` (`2026-11-06`) | Those files did not exist on `origin/main` (`8492949`) when the review was performed; they were later published to `origin/main` via PR `#10` (`3f536bf`). Original `8492949` results are preserved without fabrication. |
| `group_work_specs.docx` | **Missing / Unavailable** | `D:\saan_webapp\`, `D:\saan_webapp\docs\`, `D:\saan_webapp\prompt\`, `C:\Users\ikmie\Downloads\` | External course master specification was not present on Supanut's workspace; assigned-theme / reuse rules remain tracked externally under Issue `#3`. |
| Separate standalone log file for `npx next typegen` | **Combined with `npm run typecheck`** | `C:\Users\ikmie\.gemini\antigravity\brain\7cfbd827-ecff-4549-8b40-75c2a3e60d19\.system_generated\tasks\` (`task-79.log`) and `transcript_full.jsonl` | Both commands ran sequentially in one shell task and are preserved together in [`logs/typegen-and-typecheck-2026-11-06-8492949.log`](./logs/typegen-and-typecheck-2026-11-06-8492949.log). |
| Completed human signoff fields (`HV-01`–`HV-09` results, timestamps, signature) | **Unrecorded** | `D:\saan_webapp\docs\coursework\reviews\supanut\HUMAN-VERIFICATION-CHECKLIST.md` | Left intentionally blank in `17875df` so AI-assisted execution is never misrepresented as Supanut's personal manual signoff. |
