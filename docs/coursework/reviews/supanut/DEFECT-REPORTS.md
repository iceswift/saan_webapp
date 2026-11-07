# Defect & Boundary Reports

- **Reviewer:** Supanut Sopha (Student ID: `67070503441`)
- **Teammate / Implementation Author:** Suwiwat Sinsomboon (Student ID: `67070503444`)
- **Course:** CPE 334 Software Engineering — Project Deliverable 1
- **Reviewed Repository:** `https://github.com/iceswift/saan_webapp`
- **Reviewed Commit (`HEAD` / `origin/main`):** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949`)
- **Review Date:** 2026-11-06 (`Asia/Bangkok`)

---

## Summary of Reported Defects & Open Boundaries

| Defect ID | Title | Classification | Severity | Component / File | Status on `8492949` |
|---|---|---|---|---|---|
| **DEF-001** | Server Actions accept impossible calendar dates (e.g., `2027-02-31`) via regex-only `yyyy-mm-dd` validation | **Confirmed Defect** | Medium | `src/server/actions/orders.ts` (`L37-L45`), `src/server/actions/provider.ts` (`L84`), `src/server/actions/customer.ts` (`L155`, `L215`) | Open (Reproduced) |
| **DEF-002** | `createInstallOrder` lacks server-side idempotency guard against concurrent duplicate order submissions | **Confirmed Defect** | Medium | `src/server/actions/orders.ts` (`L51-L139`), `src/app/new/checkout/checkout-form.tsx` (`L178`) | Open (Reproduced) |
| **DEF-003** | Deposit payment (`runCustomerPayment`) does not re-verify product active status or provider `VERIFIED` status after order creation, and `createInstallOrder` reads/writes outside a transaction | **Suspected Defect / Open Boundary** | Low–Medium | `src/server/payment-service.ts` (`L78-L95`), `src/server/actions/orders.ts` (`L72-L135`) | Open (Reproduced) |
| **DEF-004** | `runtime-policy.ts` disables mock payments and test login under `next start` (`NODE_ENV=production`) even when `APP_ENV=development` and `PAYMENT_PROVIDER=mock` | **Confirmed Defect (Config/Policy)** | Low–Medium | `src/server/runtime-policy.ts` (`L18-L27`, `L41-L49`), `.env.example` | Open (Verified in code & tests) |
| **DEF-005** | Referenced coursework verification commits (`7b8ee93`, `846b532`, `f96e64c`) and `docs/coursework/*` artifacts are absent from `origin/main` (`8492949`) | **Confirmed Packaging / Repo Sync Defect** | Medium | Repository root (`docs/coursework/*`, `tests/coursework-queries.integration.test.ts`) | Open (Disclosed) |

---

## Detailed Defect Reports

### DEF-001: Server Actions accept impossible calendar dates (e.g., `2027-02-31`) via regex-only `yyyy-mm-dd` validation

- **Classification:** Confirmed Defect (Section 3.3 & Section 3.9 Open Boundary)
- **Severity:** Medium (Data Integrity / Input Validation Boundary)
- **Revision & Environment:** Commit `8492949`, Windows 11, Node `v24.14.0`, disposable SQLite DB (`file:D:/saan_webapp/storage/review-supanut/review.db`).
- **Affected Files & Lines:**
  - `src/server/actions/orders.ts` (`L37-L45` in `installSchema`)
  - `src/server/actions/provider.ts` (`L84` in `blockDateSchema`)
  - `src/server/actions/customer.ts` (`L155` in `shrineSchema`, `L215` in `vowSchema`)
  - Contrast with `src/components/thai-date.ts` (`L53-L63`, `parseYMD`)
- **Preconditions:**
  - Authenticated as a customer (`0800000002`).
  - Active product exists from a verified provider (`ศาลพระภูมิเสามังกร` from `ร้านศาลตัวอย่าง ก`).
- **Reproduction Steps:**
  1. Inspect `installSchema` in `src/server/actions/orders.ts` (`L37-L45`):
     ```ts
     preferredDates: z
       .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง"))
       .min(1, "กรุณาเลือกวันที่สะดวกอย่างน้อย 1 วัน")
       .max(3, "เลือกได้สูงสุด 3 วัน")
       .refine((dates) => {
         const today = todayInBangkok();
         return dates.every((d) => d > today);
       }, "กรุณาเลือกวันที่ในอนาคต"),
     ```
  2. Submit a `POST /new/checkout` Server Action (`createInstallOrder`) request in an authenticated customer session with `preferredDates: ["2027-02-31"]`, `placeType: "HOME"`, `area: "BKK"`, and a valid address.
  3. Query the newly created `Order` row in SQLite.
- **Expected Behavior:**
  - The server action should reject `"2027-02-31"` with a Thai validation error because February 2027 has 28 days (`parseYMD("2027-02-31") === null`), and no `Order` row should be created.
- **Actual Behavior:**
  - Because `"2027-02-31"` matches `/^\d{4}-\d{2}-\d{2}$/` and `"2027-02-31" > "2026-11-06"`, `installSchema` passes and `createInstallOrder` persists `preferredDates: '["2027-02-31"]'` in the `Order` table.
  - Note: Normal browser users interacting exclusively through the `<ThaiDateField>` calendar widget cannot pick `"2027-02-31"` because the UI grid only renders real month days (`daysInMonth`) and `parseYMD("2027-02-31")` returns `null`. However, the server boundary itself does not enforce calendar validity.
- **Recommended Fix:**
  - Extract a shared `isValidCalendarDate(ymd: string): boolean` helper (or import `parseYMD` from `@/components/thai-date`) and add `.refine((d) => parseYMD(d) !== null, "วันที่ไม่ถูกต้องตามปฏิทิน")` to `installSchema`, `blockDateSchema`, `shrineSchema`, and `vowSchema`.

---

### DEF-002: `createInstallOrder` lacks server-side idempotency guard against concurrent duplicate order submissions

- **Classification:** Confirmed Defect (Section 3.3 & Section 3.9 Open Boundary)
- **Severity:** Medium (Idempotency / Duplicate Record Creation)
- **Revision & Environment:** Commit `8492949`, Windows 11, Node `v24.14.0`, disposable SQLite DB (`file:D:/saan_webapp/storage/review-supanut/review.db`).
- **Affected Files & Lines:**
  - `src/server/actions/orders.ts` (`L51-L139`, `createInstallOrder`)
  - `src/app/new/checkout/checkout-form.tsx` (`L178`)
- **Preconditions:**
  - Authenticated as customer `0800000002` on `/new/checkout?productId=<id>`.
- **Reproduction Steps:**
  1. Observe that `createInstallOrder` deduplicates duplicate package IDs inside a single payload (`const uniquePackageIds = [...new Set(data.packageIds)];` at `L101`), and `runCustomerPayment` prevents duplicate deposit payments via a unique `MoneyOperation.key` (`${order.id}:DEPOSIT` at `src/server/payment-service.ts` `L67`).
  2. Dispatch two concurrent `POST /new/checkout` requests invoking `createInstallOrder` with the exact same payload (`productId`, `packageIds: [ceremonyPkg.id, ceremonyPkg.id]`, `placeType: "HOME"`, `area: "BKK"`, `address`, `preferredDates: ["2026-11-26"]`).
  3. Inspect the resulting `Order` rows in SQLite.
- **Expected Behavior:**
  - Duplicate `packageIds` within a single request must be deduplicated (which **passes**: each order has 2 `OrderItem` rows totaling `14,400` THB, not 3 items).
  - Concurrent duplicate submissions of the same checkout form should be deduplicated on the server (via a client-generated idempotency key or short-window duplicate guard) so only one `AWAITING_DEPOSIT` order is created.
- **Actual Behavior:**
  - Both concurrent requests succeed and create two distinct `Order` rows (`AWAITING_DEPOSIT`) with different `SN-...` codes in SQLite. Only client-side state (`if (pending || navigating) return;` in `checkout-form.tsx` `L178`) prevents double-clicks in a single browser tab.
- **Recommended Fix:**
  - Include a hidden per-checkout `clientRequestId` (UUID generated when mounting `CheckoutForm`) in `installSchema` and store/check it (or guard inside a transaction against an identical `AWAITING_DEPOSIT` order created by the same user within the past 30 seconds).

---

### DEF-003: Deposit payment (`runCustomerPayment`) does not re-verify product active status or provider `VERIFIED` status after order creation, and `createInstallOrder` reads/writes outside a transaction

- **Classification:** Suspected Defect / Open Specification Boundary (Section 3.3, Section 3.4 & Section 3.9)
- **Severity:** Low–Medium (State Transition / Concurrency Boundary)
- **Revision & Environment:** Commit `8492949`, Windows 11, Node `v24.14.0`, disposable SQLite DB.
- **Affected Files & Lines:**
  - `src/server/actions/orders.ts` (`L72-L135`, `createInstallOrder`)
  - `src/server/payment-service.ts` (`L78-L95`, `runCustomerPayment`)
- **Preconditions:**
  - Customer `0800000002` has created an order in `AWAITING_DEPOSIT` for an active product from a verified provider.
- **Reproduction Steps:**
  1. **Case A (Deactivated before `createInstallOrder`):** Load `/new/checkout?productId=<id>`, set `Product.active = false` in SQLite, and submit `createInstallOrder`.
     - Result: `createInstallOrder` re-queries `where: { id: data.productId, active: true }` (`L72-L79`) and **correctly rejects** the order with `"ไม่พบศาลที่เลือก หรือร้านปิดขายแล้ว"`.
  2. **Case B (Non-transactional read-then-write in `createInstallOrder`):** In `src/server/actions/orders.ts` (`L72-L135`), `db.product.findFirst`, `db.servicePackage.findMany`, and `db.order.create` run outside `db.$transaction`, leaving a small race window if a product or package is deactivated or repriced mid-request.
  3. **Case C (Deactivated after `createInstallOrder` but before `payDeposit`):** Create an order in `AWAITING_DEPOSIT`, then update `Product.active = false` (or `Provider.status = "SUSPENDED"`), and call `runCustomerPayment` (`kind: "PAYMENT_DEPOSIT"`).
- **Expected Behavior:**
  - If a provider is suspended (`Provider.status !== "VERIFIED"`) before deposit payment, the platform should block collecting the customer's deposit. For product deactivation (`Product.active === false`), the specification should clarify whether an unpaid `AWAITING_DEPOSIT` order remains payable as a locked quote or expires when the product is deactivated.
- **Actual Behavior:**
  - `runCustomerPayment` (`src/server/payment-service.ts` `L78-L95`) only checks `order.userId === input.userId` and `order.status === "AWAITING_DEPOSIT"`. Deposit payment succeeds (`ok: true`) and transitions the order to `AWAITING_PROVIDER` even when `Product.active` is `false`. (If `Provider.status` became `"SUSPENDED"`, the customer would pay the deposit, and the provider would then be blocked at `confirmProviderOrder` `L47` because `provider.status !== "VERIFIED"`, leaving the paid deposit stuck awaiting refund.)
- **Recommended Fix:**
  - Wrap the product/package lookup and `db.order.create` in `createInstallOrder` inside `db.$transaction`.
  - In `runCustomerPayment` (`PAYMENT_DEPOSIT`), verify that `order.provider?.status === "VERIFIED"` before accepting the customer's deposit, and document the intended rule for `Product.active === false` after order creation.

---

### DEF-004: `runtime-policy.ts` disables mock payments and test login under `next start` (`NODE_ENV=production`) when `APP_ENV=development`

- **Classification:** Confirmed Defect (Configuration / Runtime Policy Boundary)
- **Severity:** Low–Medium (Local Production-Build Testing Friction)
- **Revision & Environment:** Commit `8492949`, Windows 11, Node `v24.14.0`.
- **Affected Files & Lines:**
  - `src/server/runtime-policy.ts` (`L18-L27`, `L41-L49`)
  - `.env.example` (`L1-L26`)
- **Reproduction Steps:**
  1. Configure `.env` matching `.env.example` (`APP_ENV="development"`, `PAYMENT_PROVIDER="mock"`, `PAYMENT_MUTATIONS_DISABLED="false"`).
  2. Run `npm run build` followed by `npm run start` (`next start`, which sets `process.env.NODE_ENV = "production"`).
  3. Attempt to use test OTP display or mock deposit payment.
- **Expected Behavior:**
  - When `APP_ENV="development"` and `PAYMENT_PROVIDER="mock"` are explicitly configured for local coursework verification, mock payments and test login should either work or `.env.example` / `README.md` should document that `next start` requires `APP_ENV="staging"`, `STAGING_TEST_MODE="true"`, and `STAGING_TEST_PHONES`.
- **Actual Behavior:**
  - `canUseTestLogin` (`L19`) and `shouldUseMockPayments` (`L46`) check:
    ```ts
    if (env.NODE_ENV !== "production" && env.APP_ENV !== "production") {
      return true;
    }
    ```
    Because `next start` forces `NODE_ENV="production"`, both functions fall through to `isStagingTestMode(env)` (`APP_ENV === "staging" && STAGING_TEST_MODE === "true"`), returning `false` when `APP_ENV="development"`.
- **Recommended Fix:**
  - Document this distinction clearly in `README.md` / `.env.example` (use `npm run dev` for `APP_ENV=development`, or set `APP_ENV=staging` + `STAGING_TEST_MODE=true` when testing `next start`), or key the policy primarily off `APP_ENV` rather than `NODE_ENV`.

---

### DEF-005: Referenced coursework verification commits (`7b8ee93`, `846b532`, `f96e64c`) and `docs/coursework/*` artifacts are absent from `origin/main` (`8492949`)

- **Classification:** Confirmed Packaging / Repository Synchronization Defect (Section 1 & Section 4)
- **Severity:** Medium (Coursework Traceability & Reproducibility)
- **Revision & Environment:** Commit `849294959eeadd6ef88a8c8110c1ba3674b57925` (`HEAD` and `origin/main`).
- **Reproduction Steps:**
  1. Run `git rev-parse HEAD` and `git ls-remote origin` in `d:\saan_webapp`. Both resolve to `849294959eeadd6ef88a8c8110c1ba3674b57925`.
  2. Check for `docs/coursework/README.md`, `docs/coursework/TEAM-VERIFICATION-WORKBOOK.md`, `docs/coursework/VERIFICATION-ADDENDUM.md`, `docs/coursework/BUILD-CONTRACT.md`, `docs/coursework/check-css.mjs`, `docs/coursework/check-http.mjs`, and `tests/coursework-queries.integration.test.ts`.
- **Expected Behavior:**
  - If the coursework report cites commit `f96e64c` (`8492949` -> `7b8ee93` -> `846b532` -> `f96e64c`) and 69 integration tests, those commits and files must be pushed to the shared GitHub repository (`origin/main` or the reviewed PR branch).
- **Actual Behavior:**
  - None of `7b8ee93`, `846b532`, or `f96e64c` exist in the local `.git` object store or on `origin`. Consequently, `npm run test:integration` executes **65** integration tests (all 65 pass) rather than 69, and `docs/coursework/check-css.mjs` / `check-http.mjs` cannot be executed via their script filenames.
- **Recommended Fix:**
  - Suwiwat (`67070503444`) should push commits `7b8ee93`, `846b532`, and `f96e64c` (or open a Pull Request containing them) to `https://github.com/iceswift/saan_webapp`, and both teammates must ensure the final coursework report cites the exact commit hash where all artifacts reside.

