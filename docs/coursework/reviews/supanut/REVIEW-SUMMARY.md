# Independent Coursework Verification Summary (`REVIEW-SUMMARY.md`)

- **Reviewer:** Supanut Sopha (Student ID: `67070503441`)
- **Teammate / Implementation Author:** Suwiwat Sinsomboon (Student ID: `67070503444`)
- **Course:** CPE 334 Software Engineering — Project Deliverable 1
- **Application Under Review:** **Saan (`ศาล`)** — Thai-language Spirit-House (`ศาลพระภูมิ`) Services Marketplace
- **Repository:** `https://github.com/iceswift/saan_webapp`
- **Reviewed Commit (`HEAD` & `origin/main`):** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949` — *"Prepare runtime support and launch inventory; reject superseded OTP reuse"*)
- **Review Date:** 2026-11-06 (`Asia/Bangkok`)

---

## 1. Source Revision, Working-Tree State, and Missing Coursework Commits Disclosure

Per Section 1 of the review protocol, the exact Git state of `d:\saan_webapp` was inspected before executing any checks:

- **Current `HEAD` Commit:** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949`)
- **Remote `origin/main` Commit:** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`git ls-remote origin` confirmed `HEAD` and `refs/heads/main` are both at `8492949`).
- **Working-Tree Status at Start of Review:** Clean of tracked modifications (`?? prompt/` containing `prompt/Saan_Antigravity_Review_Prompt.md`). No application source files, tests, `.env`, or configuration files were modified during this review.
- **Disclosed Absent Commits & Files (`DEF-005`):**
  - The review prompt references a later commit chain (`8492949` -> `7b8ee93` -> `846b532` -> `f96e64c`). None of `7b8ee93`, `846b532`, or `f96e64c` exist in the local `.git` repository or on `origin`.
  - Consequently, the following files from those later commits are absent in `8492949` and were **not fabricated or reconstructed**:
    - `docs/coursework/README.md`
    - `docs/coursework/TEAM-VERIFICATION-WORKBOOK.md`
    - `docs/coursework/VERIFICATION-ADDENDUM.md`
    - `docs/coursework/BUILD-CONTRACT.md`
    - `docs/coursework/check-css.mjs`
    - `docs/coursework/check-http.mjs`
    - `tests/coursework-queries.integration.test.ts` (4 integration test cases)
  - External coursework documents (`group_work_specs.docx` and the standalone English report Parts A, B, C, E) are also outside the repository checkout.

---

## 2. Verification Environment

| Property | Value |
|---|---|
| **Operating System & Shell** | Windows 11 (`PowerShell`) |
| **Node.js / npm Versions** | Node `v24.14.0` / npm `11.18.0` |
| **Framework & Stack** | Next.js `16.2.2` (App Router, Turbopack), React `19`, TypeScript, Tailwind CSS v4, Prisma + SQLite |
| **Integration Suite Database** | `file:D:/saan_webapp/storage/tests/ci/money-test.db` (isolated per-run SQLite file managed by `scripts/test-integration.mjs`) |
| **Browser Review Database** | `file:D:/saan_webapp/storage/review-supanut/review.db` (disposable local SQLite file seeded via `npm run db:push` and `npm run db:seed`) |
| **Runtime Flags** | `PAYMENT_PROVIDER="mock"`, `APP_ENV="development"`, `PAYMENT_MUTATIONS_DISABLED="false"` (`.env` verified identical in SHA-256 hash to `.env.example` without printing secrets) |
| **Safety Boundaries** | Private Tailscale home server (`100.x.x.x`) was not accessed; no OTP codes, session tokens, or `.env` values were logged or captured in screenshots. |

---

## 3. Summary of Executed Checks

1. **Static & Build Verification (`PASS`):**
   - `npx next typegen` -> **PASS** (`0` errors).
   - `npm run typecheck` (`tsc --noEmit`) -> **PASS** (`0` errors).
   - `npm run build` (`next build`) -> **PASS** (`44/44` static pages compiled; emitted Tailwind v4 stylesheet `.next/static/chunks/411x_a1wcisvl.css` at `134,510` bytes containing all light/dark/large-text/arch tokens).
2. **Automated Integration & Unit Suites (`PASS`):**
   - `npm run test:integration` -> **65 tests, 65 pass, 0 fail** (`9,714.91 ms`) across 7 suites (`backup-restore`, `finance-admin`, `launch-readiness`, `otp`, `payments`, `provider-orders`, `storage`). *(Note: 65 tests on `8492949` vs. 69 on `f96e64c` is due to the 4 tests in the absent `tests/coursework-queries.integration.test.ts`.)*
   - Unit/policy suites (`tests/*.test.ts` excluding `*.integration.test.ts`) -> **34 tests, 34 pass, 0 fail** (`1,208.75 ms`).
3. **Absent Coursework Helper Scripts (`NOT RUN — Blocked by Missing Commit`):**
   - `node docs/coursework/check-css.mjs` -> **NOT RUN** (file absent in `8492949`; CSS output verified directly against `.next/static/chunks/411x_a1wcisvl.css`).
   - `node docs/coursework/check-http.mjs` -> **NOT RUN** (file absent in `8492949`; HTTP routes and Server Actions verified via live browser CDP and boundary scripts).
4. **End-to-End Browser Journeys (`5/5 Scenarios PASS`):**
   - **Scenario 1 (Normal Journey):** Customer `0800000002` ordered `ศาลพระภูมิเสามังกร` (`฿10,900`) + `พิธีตั้งศาลโดยพราหมณ์` (`฿3,500`) -> server created order `SN-249303` (`AWAITING_DEPOSIT`, `total = ฿14,400`, `deposit = ฿4,320`) -> customer paid mock deposit (`AWAITING_PROVIDER`, `MoneyOperation: SUCCEEDED`) -> Verified Shop A (`0800000003`) confirmed appointment for `2026-11-10 09:00` (`CONFIRMED`, `scheduledAt = 2026-11-10T02:00:00.000Z`) -> customer reloaded `/orders/[id]` and verified persisted appointment (`ร้านนัดเข้างาน อังคาร 10 พ.ย. 09:00 น.`).
   - **Scenario 2 (Blocked-Date Rejection in `Asia/Bangkok`):** Verified Shop A calendar marked `2026-11-18` (`18 พ.ย. 2569`) as `aria-disabled="true"` (`ร้านไม่ว่างวันนี้`); invoking `confirmOrder` with `scheduledAt = "2026-11-18T00:30:00+07:00"` (`2026-11-17T17:30:00Z` UTC) was rejected with `"ร้านไม่ว่างในวันที่เลือก กรุณาเลือกวันนัดอื่น"` and zero partial writes to `Order`, `OrderEvent`, or `Notification`.
   - **Scenario 3 (Ownership Restriction):** Unrelated buyer (`0800000009`) and unrelated verified provider (`0800000005`) both received 404 (`ไม่พบหน้านี้`) with zero address/phone/note leakage on detail pages and received `"คุณไม่มีสิทธิ์ทำรายการนี้"` when attempting `cancelOrder` / `confirmOrder`. Query-layer check (`verify-section3-boundaries.ts`) confirmed `getOrder` returns `null` for unrelated accounts and preserves `OrderItem` snapshot prices after catalog price edits.
   - **Scenario 4 (Logout & Protected Route Revisit):** Clicking `ออกจากระบบ` deleted the active `Session` row in SQLite (`1 -> 0`) and revisiting `/orders/[id]` redirected (`307`) to `/login?next=%2Forders%2F...`.
   - **Scenario 5 (Usability & Inclusive Design):** Validate-on-press on incomplete `/new/checkout` kept the submit button active, rendered Thai `FieldHint` errors (`#date-hint`, `#place-hint`), and focused `#date`. Enabling `.text-large` at `360×740` scaled root font to `19px`, kept `#date` height at `57px` (`>= 44px`), and produced zero horizontal overflow (`360px <= 360px`).

---

## 4. Principal Findings & Defects Identified

### Verified Core Strengths
- **Server-Authoritative Pricing & Snapshots:** `createInstallOrder` (`src/server/actions/orders.ts` `L72-L135`) computes `total` and `deposit = Math.round(total * 0.3)` exclusively from database prices and snapshots item names and prices in `OrderItem`.
- **Idempotent Mock Deposit Processing:** `runCustomerPayment` (`src/server/payment-service.ts` `L60-L159`) guards against double-charging via a unique `MoneyOperation.key` (`${orderId}:DEPOSIT`).
- **Timezone-Safe Blocked-Date Enforcement:** `confirmProviderOrder` (`src/server/provider-order-service.ts` `L20-L127`) formats `scheduledAt` in `Asia/Bangkok` before checking `ProviderBlockedDate` and uses conditional `updateMany` inside `db.$transaction`.
- **Defense-in-Depth Ownership & OTP Hardening:** Both query helpers (`getOrder`) and mutation services enforce buyer/provider ownership; commit `8492949` also rejects superseded OTP reuse (`src/server/otp-service.ts` `L139`).

### Confirmed & Suspected Defects (Detailed in `DEFECT-REPORTS.md`)
1. **`DEF-001` (Confirmed — Medium):** Server Action schemas (`installSchema` in `src/server/actions/orders.ts` `L39`, plus `blockDateSchema`, `shrineSchema`, `vowSchema`) validate `yyyy-mm-dd` strings using regex `/^\d{4}-\d{2}-\d{2}$/` and lexicographical comparison (`d > today`) without calling `parseYMD(d)`. Direct Server Action calls with impossible calendar dates such as `"2027-02-31"` succeed and persist `"2027-02-31"` into SQLite.
2. **`DEF-002` (Confirmed — Medium):** While `createInstallOrder` deduplicates repeated `packageIds` inside a single payload (`[...new Set(data.packageIds)]`), it lacks a server-side idempotency token or duplicate-submission guard. Two concurrent POST requests create two separate `AWAITING_DEPOSIT` orders (`SN-175514` and `SN-749305`).
3. **`DEF-003` (Suspected / Open Boundary — Low–Medium):** `createInstallOrder` checks `active: true` and `provider.status === "VERIFIED"` at submission time (rejecting products deactivated while on the checkout page), but performs its reads and `order.create` outside `db.$transaction`, and `runCustomerPayment` (`PAYMENT_DEPOSIT`) does not re-check `provider.status === "VERIFIED"` or `product.active` if a product/provider is deactivated after order creation.
4. **`DEF-004` (Confirmed Config/Policy — Low–Medium):** `canUseTestLogin` and `shouldUseMockPayments` in `src/server/runtime-policy.ts` (`L19`, `L46`) require `env.NODE_ENV !== "production"`, which disables mock payments and test login under `next start` (`NODE_ENV=production`) when `APP_ENV=development` unless `APP_ENV=staging` + `STAGING_TEST_MODE=true` is used.
5. **`DEF-005` (Confirmed Repo Sync — Medium):** Coursework commits `7b8ee93`, `846b532`, and `f96e64c` (`docs/coursework/*` and `tests/coursework-queries.integration.test.ts`) are not yet pushed to `origin/main`.

---

## 5. Limitations & Attribution (AI-Assisted vs. Supanut Personal Verification)

- **AI-Assisted Execution:** All automated test runs, headless Chrome CDP browser scenarios, screenshot captures, and Server Action boundary probes documented in this folder were executed with AI assistance on commit `8492949`.
- **Human Verification Requirement:** Per Section 1.9 and Section 7 of the review prompt, **Supanut Sopha (`67070503441`)** must personally repeat the manual spot-checks in [`HUMAN-VERIFICATION-CHECKLIST.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/HUMAN-VERIFICATION-CHECKLIST.md) and complete the blank human signoff fields before submitting the coursework package.

---

## 6. Index of Deliverables in `docs/coursework/reviews/supanut/`

1. [`REVIEW-SUMMARY.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/REVIEW-SUMMARY.md) — Executive summary, revision/environment metadata, missing-artifact disclosure, and principal findings.
2. [`REQUIREMENTS-FINDINGS.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/REQUIREMENTS-FINDINGS.md) — Section 3 business rules traceability matrix and open-boundary analysis.
3. [`TEST-RESULTS.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/TEST-RESULTS.md) — Complete 9-column test execution table covering static, unit, integration, browser E2E, and boundary tests.
4. [`DEFECT-REPORTS.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/DEFECT-REPORTS.md) — Reproducible defect and boundary reports (`DEF-001` through `DEF-005`).
5. [`PEER-REVIEW-PREPARATION.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/PEER-REVIEW-PREPARATION.md) — Concrete PR review questions and verification checks for reviewing Suwiwat's commits.
6. [`HUMAN-VERIFICATION-CHECKLIST.md`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/HUMAN-VERIFICATION-CHECKLIST.md) — Personal spot-check table (with blank signoff fields) and oral defense notes for Supanut.
7. [`screenshots/`](file:///d:/saan_webapp/docs/coursework/reviews/supanut/screenshots/) — 9 real execution screenshots (`01` through `09`).

