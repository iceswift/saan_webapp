# Requirements & Specification Verification Findings

- **Reviewer:** Supanut Sopha (Student ID: `67070503441`)
- **Teammate / Implementation Author:** Suwiwat Sinsomboon (Student ID: `67070503444`)
- **Course:** CPE 334 Software Engineering — Project Deliverable 1
- **Reviewed Repository:** `https://github.com/iceswift/saan_webapp`
- **Reviewed Commit (`HEAD` / `origin/main`):** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949`)
- **Review Date:** 2026-11-06 (`Asia/Bangkok`)

---

## 1. Document Scope and Source Availability Disclosure

Per Section 1.6–1.8 of the review protocol, this document records findings strictly from files present in the local checkout at commit `8492949`:
- **Available and inspected in repository:** `AGENTS.md`, `README.md`, `.env.example`, `docs/PLAN.md`, `docs/OPERATIONS.md`, `docs/DEPLOYMENT-STATUS.md`, `docs/SECURITY-REVIEW-2026-11-04.md`, `docs/INCLUSIVE-QA-2026-11-04.md`, `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/seed-demo.ts`, `src/**`, `tests/**`, and `scripts/**`.
- **Absent from repository (`8492949` and `origin/main`):**
  - `docs/coursework/README.md`, `docs/coursework/TEAM-VERIFICATION-WORKBOOK.md`, `docs/coursework/VERIFICATION-ADDENDUM.md`, `docs/coursework/BUILD-CONTRACT.md`, `docs/coursework/check-css.mjs`, `docs/coursework/check-http.mjs`
  - `tests/coursework-queries.integration.test.ts`
  - Referenced later commits `7b8ee93`, `846b532`, and `f96e64c`
  - External coursework documents `group_work_specs.docx` and the standalone English report (Parts A, B, C, E)

Where a coursework requirement ID (`FR-*`, `BR-*`, `AC-*`) was defined in `prompt/Saan_Antigravity_Review_Prompt.md` (Section 3), it is verified below against the actual implementation in `8492949`. Every finding is classified as:
- **Verified (Pass):** Rule holds in code, automated tests, and runtime execution.
- **Confirmed Defect:** Reproducible violation of a stated specification rule or input boundary in `8492949`.
- **Suspected Defect / Design Gap:** Boundary behavior where the specification is partially enforced or leaves an unguarded transition.
- **Unverified Concern:** Item dependent on absent external coursework documents (`group_work_specs.docx` / Parts A–E report) or unpushed commits (`7b8ee93`, `846b532`, `f96e64c`).

---

## 2. Requirements & Business Rules Traceability Matrix (Section 3)

| Rule Ref | Requirement / Business Rule Summary | Primary Code Locations (`8492949`) | Status | Evidence Summary |
|---|---|---|---|---|
| **3.1 / Roles & Access** | Four distinct actor states: Customer (`CUSTOMER`), Verified Provider (`PROVIDER` + `Provider.status === "VERIFIED"`), Pending/Suspended Provider (`PROVIDER` + `status !== "VERIFIED"`), and Admin (`ADMIN`). Only verified providers may publish active catalog items to buyers or confirm orders. | `src/server/auth.ts` (`L137-L185`), `src/server/queries.ts` (`L35-L120`), `src/server/provider-order-service.ts` (`L42-L54`), `src/server/actions/provider.ts` (`L18-L65`) | **Verified (Pass)** | `requireUser`, `requireProvider`, `requireVerifiedProvider`, and `requireAdmin` enforce role gates on pages and actions. `listProducts` and `getProduct` filter by `active: true` and `provider: { status: "VERIFIED" }`. Pending provider `0800000004` (`ช่างตัวอย่าง ข`) cannot confirm orders (`ยังไม่ได้รับการยืนยันจากแอดมิน`). |
| **3.2 / Phone OTP Login** | Thai mobile number normalization (`^0[689]\d{8}$`), 6-digit OTP with 5-minute TTL, rate limits (5/10m per phone, 20/10m global), max 5 attempts per OTP, rejection of superseded OTPs, and HTTP-only `saan_session` cookie (30-day TTL). | `src/server/otp-service.ts` (`L42-L202`), `src/server/auth.ts` (`L14-L135`), `src/server/runtime-policy.ts` (`L18-L27`), `tests/otp.integration.test.ts` | **Verified (Pass)** (with config note **DEF-004**) | `issueOtpChallenge` normalizes phone format and enforces 5/10m per-phone and 20/10m global limits. `verifyOtpChallenge` checks `latestOtp.id !== matched.id` (`L139`) inside a serializable logic flow and increments `attempts` on mismatch. `tests/otp.integration.test.ts` passes all 9 OTP cases. |
| **3.3 / Customer Order Creation** | Buyer selects an active product from a verified shop, optional active packages from the same shop, 1–3 future preferred dates (`Asia/Bangkok`), place type, service area, and address (>=8 chars). Server computes `total` and `deposit = round(total * 0.3)` and snapshots item prices in `OrderItem`. | `src/server/actions/orders.ts` (`L29-L139`), `src/lib/constants.ts` (`DEPOSIT_RATE = 0.3`), `src/app/new/checkout/checkout-form.tsx` | **Partial — Confirmed Defects DEF-001 & DEF-002** | Server-side price calculation, 30% deposit rounding, same-provider package check (`providerId: product.providerId, active: true`), and `OrderItem` price snapshot work as specified. However, server regex validation accepts impossible calendar dates (`2027-02-31`, **DEF-001**) and `createInstallOrder` lacks server-side idempotency against duplicate concurrent submissions (**DEF-002**). |
| **3.4 / Mock Deposit Payment** | Owning customer pays 30% deposit on an `AWAITING_DEPOSIT` order when `PAYMENT_PROVIDER=mock` and `PAYMENT_MUTATIONS_DISABLED=false`. Creates idempotent `MoneyOperation` (`<orderId>:DEPOSIT`), `Payment` (`PAID`), `OrderEvent`, notifications, and transitions order to `AWAITING_PROVIDER`. | `src/server/payment-service.ts` (`L60-L159`), `src/server/actions/orders.ts` (`L141-L162`), `tests/payments.integration.test.ts` | **Verified (Pass)** (with boundary note **DEF-003**) | `runCustomerPayment` uses `MoneyOperation` unique key `${order.id}:DEPOSIT` to prevent double-charging, verifies `order.userId === input.userId` and `order.status === "AWAITING_DEPOSIT"`, and transitions order to `AWAITING_PROVIDER`. All 19 payment integration tests pass. |
| **3.5 / Shop Confirmation & Blocked-Date Rule** | Owning verified shop confirms an `AWAITING_PROVIDER` order with a future `scheduledAt` timestamp. Server converts `scheduledAt` to an `Asia/Bangkok` calendar date (`yyyy-mm-dd`) and rejects if that Bangkok date is in `ProviderBlockedDate`, with zero partial writes. | `src/server/provider-order-service.ts` (`L20-L127`), `src/server/actions/provider.ts` (`L129-L144`), `tests/provider-orders.integration.test.ts` | **Verified (Pass)** | `formatDateInBangkok(parsed)` (`L20-L26`) uses `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" })`. Even when `scheduledAt` is `2026-11-18T00:30:00+07:00` (`2026-11-17T17:30:00.000Z` in UTC), the server maps it to Bangkok date `2026-11-18`, matches `ProviderBlockedDate`, returns `"ร้านไม่ว่างในวันที่เลือก กรุณาเลือกวันนัดอื่น"`, and leaves `Order`, `OrderEvent`, and `Notification` unchanged. |
| **3.6 / Ownership & Data Visibility** | Only the owning buyer, owning provider, or `ADMIN` may view an order or its private fields (`address`, customer `phone`, `note`, `events`, `messages`). Unrelated buyers and unrelated providers must receive 404 (`notFound()`) on detail pages and forbidden errors on mutations. | `src/server/queries.ts` (`L227-L295`), `src/app/orders/[id]/page.tsx` (`L35-L41`), `src/app/provider/orders/[id]/page.tsx` (`L29-L36`), `src/server/payment-service.ts` (`L84-L86`), `src/server/provider-order-service.ts` (`L56-L61`) | **Verified (Pass)** | `getOrder` returns `null` when `viewer.role !== "ADMIN" && !isCustomer && !isProvider` (`L255`). Detail pages also verify `order.viewerIs` (`CUSTOMER` vs `PROVIDER`) and call `notFound()`. Browser Scenario 3 and boundary script verified that neither unrelated buyer `0800000009` nor unrelated verified provider `0800000005` can view or mutate Shop A's orders. |
| **3.7 / Logout & Protected Routes** | Logging out deletes the server-side `Session` record in SQLite and clears the `saan_session` cookie. Subsequent visits to protected routes (`/orders/[id]`, `/provider/*`, `/account`, `/settings/*`) redirect to `/login?next=...`. | `src/server/auth.ts` (`L68-L82`, `L137-L144`), `src/server/actions/auth.ts` (`L103-L107`) | **Verified (Pass)** | Browser Scenario 4 confirmed `Session` count for `0800000002` dropped to `0` upon clicking `ออกจากระบบ`, and revisiting `/orders/[id]` returned HTTP `307` redirecting to `/login?next=%2Forders%2F...`. |
| **3.8 / Usability & Inclusive Design** | Thai-first clear UI for elderly users: `html.text-large` (112.5% root font scaling), validate-on-press (`FieldHint error` + `focusFirstInvalid`) instead of disabled submit buttons, >=44px tap targets (`min-h-11`), `ThaiDateField` (`พ.ศ.`) calendar with disabled blocked dates, no horizontal overflow at `360×740`, and `TrustNote` with `testMode` notice. | `src/app/globals.css`, `src/components/field-hint.tsx`, `src/components/thai-date-field.tsx`, `src/components/trust-note.tsx`, `src/app/new/checkout/checkout-form.tsx` | **Verified (Pass)** | Browser Scenario 5 verified that pressing `ยืนยันคำสั่งซื้อ` on an incomplete checkout form keeps the button active, renders inline Thai errors (`#date-hint`, `#place-hint`), moves focus to `#date`, scales root font size to `18px` (`112.5%`) under `.text-large`, maintains a 48px–54px date field height, and produces zero horizontal overflow (`scrollWidth: 360 <= innerWidth: 360`) at `360×740`. |

---

## 3. Detailed Analysis of Section 3.9 Open Boundaries

### 3.9.1 Boundary A — Impossible Calendar Dates (`2027-02-31`)
- **Classification:** **Confirmed Defect (`DEF-001`)**
- **Where Checked:**
  - Client UI helper: `parseYMD(ymd)` in `src/components/thai-date.ts` (`L53-L63`) constructs `new Date(y, m - 1, d)` and checks `dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d`. For `"2027-02-31"`, JavaScript rolls over to March 3 (`dt.getMonth() === 2 !== 1`), so `parseYMD("2027-02-31")` returns `null`. Furthermore, the `ThaiDateField` calendar grid (`src/components/thai-date-field.tsx`) only renders real days for the selected month (`daysInMonth`).
  - Server Action schema: `installSchema` in `src/server/actions/orders.ts` (`L37-L45`) validates `preferredDates` using:
    ```ts
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง")
    ```
    followed by `.refine((dates) => dates.every((d) => d > today), "กรุณาเลือกวันที่ในอนาคต")`.
- **Why It Fails on Direct Server Action Input:**
  - `"2027-02-31"` matches `/^\d{4}-\d{2}-\d{2}$/` and is lexicographically greater than `"2026-11-06"`. Because `installSchema` does not call `parseYMD(d)` (or validate real calendar existence), invoking `createInstallOrder` with `preferredDates: ["2027-02-31"]` succeeds and persists `preferredDates: '["2027-02-31"]'` into `Order`.
  - The same regex-only pattern appears in `blockDateSchema` (`src/server/actions/provider.ts` `L84`), `shrineSchema` (`src/server/actions/customer.ts` `L155`), and `vowSchema` (`src/server/actions/customer.ts` `L215`).
- **Suggested Clarification / Fix:**
  - Add `.refine((d) => parseYMD(d) !== null, "วันที่ไม่มีอยู่จริงในปฏิทิน")` to all `yyyy-mm-dd` Zod schemas on the server, and document in the specification that all `yyyy-mm-dd` fields must be valid Gregorian calendar dates in `Asia/Bangkok`.

### 3.9.2 Boundary B — Stale Product Eligibility (Deactivation After Page Load or Order Creation)
- **Classification:** **Verified at Order Creation / Suspected Defect at Deposit Payment (`DEF-003`)**
- **Where Checked:**
  1. **Product deactivated while customer is on `/new/checkout` (Before `createInstallOrder`):**
     - `createInstallOrder` (`src/server/actions/orders.ts` `L72-L79`) re-queries:
       ```ts
       const product = await db.product.findFirst({
         where: { id: data.productId, active: true },
         include: { provider: true },
       });
       if (!product || product.provider.status !== "VERIFIED") {
         return fail("ไม่พบศาลที่เลือก หรือร้านปิดขายแล้ว");
       }
       ```
     - **Result:** If the shop deactivates the product (`active: false`) or an admin suspends the provider (`status: "SUSPENDED"`) while the buyer has the checkout form open, submitting the checkout form is **rejected** with `"ไม่พบศาลที่เลือก หรือร้านปิดขายแล้ว"`.
  2. **Non-transactional gap inside `createInstallOrder` and post-creation deposit payment (`runCustomerPayment`):**
     - Inside `createInstallOrder` (`src/server/actions/orders.ts` `L72-L135`), `db.product.findFirst`, `db.servicePackage.findMany`, and `db.order.create` execute sequentially without wrapping in `db.$transaction`.
     - More importantly, once an order is created in `AWAITING_DEPOSIT`, if the shop subsequently deactivates the product (`Product.active = false`) or the provider becomes `SUSPENDED` before the customer pays the deposit, `runCustomerPayment` (`src/server/payment-service.ts` `L78-L95`) only checks `order.status !== "AWAITING_DEPOSIT"` and does **not** re-check `order.provider.status === "VERIFIED"` or product active status.
     - **Empirical Verification:** In `verify-section3-boundaries.ts`, deactivating `productA` (`active: false`) after order creation still allowed `runCustomerPayment` (`PAYMENT_DEPOSIT`) to succeed (`ok: true`) and transition the order to `AWAITING_PROVIDER`.
- **Suggested Clarification / Fix:**
  - The specification should explicitly state whether `AWAITING_DEPOSIT` acts as a binding quote (allowing deposit payment even if the catalog item is later hidden from new buyers, provided the provider is still `VERIFIED`) or whether deposit payment must re-verify `provider.status === "VERIFIED"` and/or `product.active === true`. At minimum, `runCustomerPayment` should reject deposit payment if `order.provider.status !== "VERIFIED"`.

### 3.9.3 Boundary C — Duplicate Submission Behavior
- **Classification:** **Verified for Package IDs & Payments / Confirmed Defect for Concurrent Order Creation (`DEF-002`)**
- **Where Checked:**
  1. **Duplicate `packageIds` in a single checkout payload:**
     - `createInstallOrder` (`src/server/actions/orders.ts` `L101`) deduplicates package IDs via `const uniquePackageIds = [...new Set(data.packageIds)];`. Passing `[pkgId, pkgId]` charges the package only once and creates only one `OrderItem` for that package.
  2. **Duplicate deposit / balance payment clicks:**
     - `runCustomerPayment` (`src/server/payment-service.ts` `L67`) uses `MoneyOperation` with unique key `${order.id}:DEPOSIT` (or `${order.id}:BALANCE`). Concurrent or repeated payment requests return the existing `SUCCEEDED` or `PENDING` operation without creating duplicate `Payment` records.
  3. **Duplicate `createInstallOrder` requests (double-submit / network retry):**
     - While the client UI (`src/app/new/checkout/checkout-form.tsx` `L178`) checks `if (pending || navigating) return;`, `createInstallOrder` (`src/server/actions/orders.ts` `L51-L139`) accepts no client idempotency key and performs no server-side duplicate check (such as checking for an identical `AWAITING_DEPOSIT` order created by the same `userId` and `productId` within the last few seconds).
     - Sending two concurrent `createInstallOrder` requests creates two distinct `AWAITING_DEPOSIT` orders (`SN-...`) in SQLite.
- **Suggested Clarification / Fix:**
  - Add a client-generated idempotency token (or a short-window deduplication check on `(userId, productId, total, address)` in `createInstallOrder`) so network retries or rapid double-posts cannot create duplicate unpaid orders.

### 3.9.4 Additional Runtime Policy Finding — `APP_ENV=development` Under Production Server (`next start`)
- **Classification:** **Confirmed Defect / Documentation-Config Mismatch (`DEF-004`)**
- **Where Checked:**
  - `src/server/runtime-policy.ts` (`L18-L27`):
    ```ts
    export function canUseTestLogin(env: EnvMap = process.env): boolean {
      if (env.NODE_ENV !== "production" && env.APP_ENV !== "production") {
        return true;
      }
      return isStagingTestMode(env);
    }
    ```
    and `shouldUseMockPayments` (`L41-L49`) has the identical `env.NODE_ENV !== "production" && env.APP_ENV !== "production"` guard.
- **Impact:**
  - Because `next build` and `next start` force `NODE_ENV="production"`, running a built server (`npm run start`) with `.env` set to `APP_ENV="development"` and `PAYMENT_PROVIDER="mock"` causes both `canUseTestLogin` and `shouldUseMockPayments` to return `false`! Only `npm run dev` (`NODE_ENV="development"`) or configuring `APP_ENV="staging"` with `STAGING_TEST_MODE="true"` and `STAGING_TEST_PHONES` enables mock payments and test login under `next start`.

---

## 4. Direct Review of the 27-Page Deliverable 1 Report (`index.pdf` Parts A–F) & GitHub Issues `#4`, `#5`, `#8`

Following delivery of the 27-page English report (*"Saan Engineering Baseline and Sprint 1"*, `index.pdf`), each declared Sprint 1 identifier in Parts A, B, C, E, and F was cross-checked against commit `8492949`:

### 4.1 Traceability Check of Report Identifiers (`FR-01`..`FR-04`, `BR-01`..`BR-06`, `NFR-01`..`NFR-04`, `AC-01`..`AC-12`)

| Report ID (`index.pdf`) | Report Statement (Parts A, C, E) | Code / Runtime Verification on `8492949` | Finding |
|---|---|---|---|
| **FR-01 / F-01 / AC-01..03** | Establish current-user identity via 6-digit test OTP (`requestOtp`, `verifyOtp`), reject wrong/expired/replayed/superseded codes (`BR-06`), and invalidate session + cookie on `logout`. | `src/server/otp-service.ts` (`L42-L202`), `src/server/auth.ts` (`L14-L144`), `tests/otp.integration.test.ts` (9/9 pass), Browser `E2E-04`. | **Accurate & Verified.** `latestOtp.id !== matched.id` (`L139`) rejects superseded OTPs; `logout` deletes the `Session` row (`1 -> 0`) and redirects protected routes (`307`) to `/login?next=...`. |
| **FR-02 / F-02 / AC-04** | Browse active products from verified providers and inspect authoritative price and shop; reject inactive or unverified items at order submission even from a stale open page. | `src/server/queries.ts` (`listProducts` `L35`, `getProduct` `L94`), `src/server/actions/orders.ts` (`L72-L76`), Browser `BND-02`. | **Accurate & Verified.** Deactivating a product while `/new/checkout` is open causes `createInstallOrder` to return `{"ok":false,"error":"ไม่พบศาลที่เลือก หรือร้านปิดขายแล้ว"}`. |
| **DEC-02 (Signed-in Buyer Policy)** | *"Any signed-in account may buy for itself; `createInstallOrder` derives the buyer from the session without requiring `CUSTOMER` role. Shop management still requires the owning verified provider."* (Report p.5, p.10, p.15) | `src/server/actions/orders.ts` (`L61-L62`: `const user = await getCurrentUser(); if (!user) return NOT_LOGGED_IN;`), `src/server/provider-order-service.ts` (`L42-L54`). | **Accurate & Verified.** `createInstallOrder` deliberately allows any authenticated user (`CUSTOMER`, `PROVIDER`, `ADMIN`) to purchase for themselves while restricting `/provider` confirmation to the owning `VERIFIED` shop. |
| **FR-03 / F-03 / BR-01..02 / AC-05..07** | Persist an `INSTALL` order (`AWAITING_DEPOSIT`) with server-computed `total`, `deposit = Math.round(total * 0.30)`, deduplicated same-provider active packages (`<=10`), trimmed address (`5..500` chars), note (`<=1000` chars), 1–3 future `Asia/Bangkok` dates with at least one unblocked day, and `OrderItem` snapshots. | `src/server/actions/orders.ts` (`L33-L139`), Browser `E2E-01A`, `E2E-03A..C`, `BND-01`, `BND-04`. | **Core Verified; Two Open Boundaries Confirmed (`DEF-001`, `DEF-002`):**<br>1. `installSchema` (`L38`) matches the report's `min(5).max(500)` address rule and `DEPOSIT_RATE = 0.30`.<br>2. **Confirmed Defect `DEF-001` (Issue #6):** `preferredDates` (`L39-L42`) only checks regex `/^\d{4}-\d{2}-\d{2}$/` and `d <= todayInBangkok()`, accepting `"2027-02-31"` (`BND-01`).<br>3. **Confirmed Defect `DEF-002` (Issue #7):** Concurrent duplicate `createInstallOrder` POSTs create two separate `AWAITING_DEPOSIT` orders (`BND-04`). |
| **FR-04 / F-04 / BR-03..05 / AC-08..12** | Record idempotent test deposit (`AWAITING_PROVIDER`), allow only owning verified provider to confirm a future appointment on an open `Asia/Bangkok` date (`CONFIRMED`), roll back all writes on blocked-day rejection (`NFR-02`), and resolve concurrent confirm/cancel atomically. | `src/server/payment-service.ts` (`L60-L159`), `src/server/provider-order-service.ts` (`L20-L127`), `tests/payments.integration.test.ts`, `tests/provider-orders.integration.test.ts`, Browser `E2E-01B..D`, `E2E-02A..B`. | **Accurate & Verified.** `MoneyOperation` (`<orderId>:DEPOSIT`) prevents duplicate deposit effects; `formatDateInBangkok` (`L20-L26`) enforces Bangkok calendar day even at `00:30+07:00` (`17:30Z` previous UTC day) with zero partial writes on rejection. |
| **NFR-01 / NFR-02 / NFR-03 / NFR-04** | Zero private fields leaked on forbidden access (`NFR-01`); atomic rollback on failed confirmation (`NFR-02`); `>=44px` controls & no horizontal overflow with normal/large text (`NFR-03`); reproducible synthetic setup and build/test commands (`NFR-04`). | `src/server/queries.ts` (`L227-L295`), `src/app/globals.css`, Browser `E2E-02B`, `E2E-03A..C`, `E2E-05A..B`, `AUTO-01..05`. | **Verified (with minor wording note on `NFR-03`):** In `src/app/globals.css`, `html.text-large` sets `font-size: 118.75%` (`19px` root font), and `#date` rendered at `57px` height with zero horizontal overflow (`360px <= 360px`). |

### 4.2 Review of Build Correction & Multi-Tier Verification Assertions (Issue #8 & Report Part F p.19–24)

1. **Three Tiers of Verification Evidence (Service/Query vs. Session-Backed HTTP vs. Browser UI):**
   - **Tier 1 — Service & Query Integration Tests (`npm run test:integration`):** Exercise Prisma and domain services (`confirmProviderOrder`, `runCustomerPayment`, `verifyOtpChallenge`, `getOrder`) directly against `storage/tests/ci/money-test.db`. They prove transactional rollback (`NFR-02`), `MoneyOperation` idempotency (`AC-08`), race handling (`AC-12`), price snapshot immutability (`CQ-03`), and query-level null projection (`CQ-04`), but pass `userId` / `viewer` arguments directly rather than parsing an HTTP cookie or Next.js Server Action payload.
   - **Tier 2 — Session-Backed HTTP Action Checks (`HTTP-01`..`HTTP-09` / CDP `fetch` probes):** Exercise the actual Next.js route handlers and `Next-Action` POST endpoints using an HTTP-only `saan_session` cookie derived from `verifyOtp`, proving that authenticated wrappers (`src/server/actions/orders.ts`, `src/server/actions/provider.ts`) never accept a caller-supplied `userId` or `total` and that `logout` invalidates the stored session.
   - **Tier 3 — Real Browser UI Journeys (`E2E-01A`..`E2E-05B`, Screenshots `01`..`09`):** Exercise the rendered Thai client components (`CheckoutForm`, `ThaiDateField`, `OrderActions`, `ProviderOrderActions`), proving full UI-created order persistence (closing the gap noted on Report p.21/p.25 where `VIS-01` only retrieved an HTTP-created order), disabled struck-through blocked dates in the Buddhist Era (`พ.ศ.`) calendar, validate-on-press focus management, and compiled CSS layout geometry.
2. **Build & Stylesheet Correction Inspection (`BLD-AC-01`..`BLD-AC-03`):**
   - On `origin/main` (`8492949`), `package.json` uses `"@tailwindcss/turbopack": "^4"` without `postcss.config.mjs`. Running the default `npm run build` (Turbopack) on `8492949` succeeded and emitted `.next/static/chunks/411x_a1wcisvl.css` (`134,510` bytes) with compiled Tailwind v4 `@layer theme`, `@layer base`, and `@layer utilities` (`.flex{display:flex}`, `.site-island`, `.text-large`).
   - However, as documented on Report p.23, building with `--webpack` requires `@tailwindcss/postcss` and `postcss.config.mjs` from commit `846b532`. Because commits `7b8ee93`, `846b532`, and `f96e64c` have not yet been pushed to `origin/main` (Issue #2), Suwiwat must push those commits so `BUILD-CONTRACT.md`, `check-css.mjs`, `check-http.mjs`, and `tests/coursework-queries.integration.test.ts` (`CQ-01`..`CQ-04`) are present in the shared GitHub repository.

---

## 5. Missing / Unverified Coursework Artifacts Disclosure

| Missing Item | Referenced In | Status in `8492949` | Reviewer Assessment |
|---|---|---|---|
| `docs/coursework/README.md`, `TEAM-VERIFICATION-WORKBOOK.md`, `VERIFICATION-ADDENDUM.md`, `BUILD-CONTRACT.md` | Prompt Sections 1.5, 1.7, 2.2, 4; Issues #2, #4, #5, #8 | Absent from `origin/main` (`8492949`) | **Tracked in Issue #2 (`DEF-005`):** Created in Suwiwat's local commits (`7b8ee93`, `846b532`, `f96e64c`). Must be pushed to GitHub before closing Issue #2 and Issue #9. |
| `docs/coursework/check-css.mjs`, `docs/coursework/check-http.mjs` | Prompt Section 4; Report p.20, p.23; Issue #8 | Absent from `origin/main` (`8492949`) | **Not Run by Script Name (`DEF-005`):** Underlying CSS compilation and session-backed HTTP action behaviors were verified directly on `8492949`. |
| `tests/coursework-queries.integration.test.ts` (`CQ-01`..`CQ-04`, 4 tests) | Prompt Section 4; Report p.19, p.24; Issue #8 | Absent from `origin/main` (`8492949`) | **Tracked in Issue #2 (`DEF-005`):** Explains why `npm run test:integration` runs **65** tests on `8492949` vs. **69** in Report p.19. Equivalent query ownership & price-snapshot assertions were executed in `E2E-03C`. |
| `group_work_specs.docx` | Report p.1, p.5 (`OD-01`); Issue #3 | External course master specification | **Tracked in Issue #3:** Remains an open external course check. |

