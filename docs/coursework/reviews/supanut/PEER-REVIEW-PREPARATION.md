# Peer Review Preparation Guide (Supanut Reviewing Suwiwat's Changes)

- **Reviewer:** Supanut Sopha (Student ID: `67070503441`)
- **Author Being Reviewed:** Suwiwat Sinsomboon (Student ID: `67070503444`)
- **Course:** CPE 334 Software Engineering — Project Deliverable 1
- **Reviewed Baseline Commit (`origin/main`):** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949`)
- **Expected Incoming Commits / PR:** `7b8ee93`, `846b532`, `f96e64c`

---

## 1. Purpose of This Document

This guide equips **Supanut Sopha (`67070503441`)** with concrete code-review questions, line-level inspection points, and command-line checks when reviewing Pull Requests or commits from **Suwiwat Sinsomboon (`67070503444`)**—both for the current application code at `8492949` and for the coursework verification commits (`7b8ee93`, `846b532`, `f96e64c`).

---

## 2. Repository Synchronization & Commit Lineage Checks (First Gate)

Before approving any coursework PR or finalizing the Deliverable 1 submission, verify the Git history:

1. **Check that `7b8ee93`, `846b532`, and `f96e64c` are pushed to `origin`:**
   ```powershell
   git fetch origin
   git log --oneline origin/main -n 8
   ```
   - **Question for Suwiwat:** *"Currently `origin/main` is at `8492949`, so `docs/coursework/*` and `tests/coursework-queries.integration.test.ts` (4 tests) are not in the remote repository yet. Can you push `7b8ee93`, `846b532`, and `f96e64c` (or open a PR with them) so our shared GitHub repo matches the 69 integration tests cited in the coursework documentation?"*
2. **Verify no sensitive files or local databases are tracked:**
   ```powershell
   git status --short
   git diff --name-only 8492949..HEAD
   ```
   - Confirm `.env`, `storage/*.db`, session cookies, and OTP codes are never committed.

---

## 3. Code-Level Review Questions by Subsystem

### 3.1 Server-Side Price Calculation & Deposit Integrity (`src/server/actions/orders.ts`)
- **Lines to Inspect:** `src/server/actions/orders.ts` (`L72-L135`), `src/lib/constants.ts` (`DEPOSIT_RATE = 0.3`).
- **What Works Well:**
  - `createInstallOrder` ignores client-side price totals and queries `db.product.findFirst` (`L72`) and `db.servicePackage.findMany` (`L103`), calculates `total = product.price + packages.reduce(...)` (`L112`), computes `deposit = Math.round(total * DEPOSIT_RATE)` (`L113`), and writes immutable price snapshots to `OrderItem` (`L129-L133`).
  - Duplicate `packageIds` in the request array are deduplicated via `[...new Set(data.packageIds)]` (`L101`).
- **Review Questions / Suggestions for Suwiwat:**
  1. **Impossible Calendar Dates (`DEF-001`):**
     > *"In `src/server/actions/orders.ts` (`L39`), `preferredDates` only checks `/^\d{4}-\d{2}-\d{2}$/` and `d > today`. While `<ThaiDateField>` blocks invalid dates in the UI, calling the Server Action directly with `2027-02-31` succeeds and writes `2027-02-31` to the database. Should we add `.refine((d) => parseYMD(d) !== null)` using `parseYMD` from `src/components/thai-date.ts` (`L53`) to `installSchema`, `blockDateSchema`, `shrineSchema`, and `vowSchema`?"*
  2. **Duplicate Order Creation Idempotency (`DEF-002`):**
     > *"In `runCustomerPayment` (`src/server/payment-service.ts` `L67`), we have a strong `MoneyOperation` idempotency key (`${order.id}:DEPOSIT`), but `createInstallOrder` (`src/server/actions/orders.ts` `L51`) relies on client button state (`if (pending || navigating) return;`) to prevent duplicate orders. If a user's mobile connection retries the POST request, two `AWAITING_DEPOSIT` orders are created. Should we pass a client-generated request UUID from `CheckoutForm` or guard against duplicate unpaid orders in a short time window?"*
  3. **Transaction Wrapping in `createInstallOrder` (`DEF-003`):**
     > *"In `createInstallOrder` (`L72-L135`), `product.findFirst`, `servicePackage.findMany`, and `order.create` run outside `db.$transaction`. Wrapping them in `db.$transaction` would guarantee the product and packages cannot be deactivated or repriced between the read and insert."*

### 3.2 Shop Schedule Confirmation & `Asia/Bangkok` Blocked-Date Rule (`src/server/provider-order-service.ts`)
- **Lines to Inspect:** `src/server/provider-order-service.ts` (`L20-L127`), `tests/provider-orders.integration.test.ts` (`L41-L215`).
- **What Works Well:**
  - `formatDateInBangkok(parsed)` (`L20-L26`) converts the incoming `scheduledAt` `Date` into `yyyy-mm-dd` in `Asia/Bangkok` before querying `db.providerBlockedDate.findUnique`. This prevents UTC midnight offset bugs (e.g., `2026-11-08T00:30:00+07:00` is `2026-11-07T17:30:00Z` in UTC, which is still `2026-11-08` in Bangkok).
  - The status transition uses `tx.order.updateMany({ where: { id: order.id, providerId: provider.id, status: "AWAITING_PROVIDER" } })` (`L84-L90`) and throws `"Order state changed concurrently"` if `updated.count !== 1`, preventing race conditions between concurrent confirm/decline requests.
- **Review Question for Suwiwat:**
  > *"When a provider blocks a new date via `setDateBlocked` (`src/server/actions/provider.ts` `L86`), it blocks future `confirmProviderOrder` calls for that date. Does the specification allow blocking a date that already has an existing `CONFIRMED` order, or should `setDateBlocked` warn the shop if they already have a confirmed appointment on that Bangkok date?"*

### 3.3 Ownership & Access Control (`src/server/queries.ts`, `src/app/orders/[id]/page.tsx`, `src/app/provider/orders/[id]/page.tsx`)
- **Lines to Inspect:** `src/server/queries.ts` (`L227-L295`), `src/app/orders/[id]/page.tsx` (`L35-L41`), `src/app/provider/orders/[id]/page.tsx` (`L29-L36`).
- **What Works Well:**
  - `getOrder(id, viewer)` checks ownership at the query layer (`isCustomer || isProvider || viewer.role === "ADMIN"`) and returns `null` before mapping private fields (`address`, `user.phone`, `note`, `events`, `messages`).
  - Furthermore, `/orders/[id]/page.tsx` checks `if (order.viewerIs === "PROVIDER" && user.role !== "ADMIN") notFound();` (`L39`), and `/provider/orders/[id]/page.tsx` checks `if (!order || order.viewerIs !== "PROVIDER") notFound();` (`L34`).
- **Review Question for Suwiwat (for commit `846b532` / `tests/coursework-queries.integration.test.ts`):**
  > *"When reviewing `tests/coursework-queries.integration.test.ts` from commit `846b532`, let's confirm it tests both `getOrder` returning `null` for an unrelated customer AND for an unrelated verified provider, as well as `listMyOrders` / `listProviderOrders` scoping."*

### 3.4 OTP Security & Runtime Policy (`src/server/otp-service.ts`, `src/server/runtime-policy.ts`)
- **Lines to Inspect:** `src/server/otp-service.ts` (`L42-L202`), `src/server/runtime-policy.ts` (`L18-L49`).
- **What Works Well:**
  - Commit `8492949` fixed superseded OTP reuse by querying the latest unused OTP (`L129-L133`) and rejecting any older code (`if (latestOtp.id !== matched.id)` at `L139`).
- **Review Question for Suwiwat (`DEF-004`):**
  > *"In `src/server/runtime-policy.ts` (`L19` and `L46`), `canUseTestLogin` and `shouldUseMockPayments` check `env.NODE_ENV !== 'production' && env.APP_ENV !== 'production'`. Because `next start` sets `NODE_ENV='production'`, running `next start` locally with `APP_ENV='development'` disables mock payments unless `APP_ENV='staging'` and `STAGING_TEST_MODE='true'` are set. How does `docs/coursework/check-http.mjs` in commit `7b8ee93` start the server, and should we document those env vars in `README.md`?"*

---

## 4. Checklist for Reviewing Incoming Coursework Commits (`7b8ee93`, `846b532`, `f96e64c`)

When Suwiwat pushes or shares the coursework commits, Supanut should run these checks before merging:

- [ ] `git log --stat 8492949..f96e64c` shows only coursework documentation (`docs/coursework/*`) and `tests/coursework-queries.integration.test.ts` without unintended production mutations.
- [ ] `npm run test:integration` passes all **69** tests (`65` existing + `4` in `tests/coursework-queries.integration.test.ts`).
- [ ] `node docs/coursework/check-css.mjs` passes against the production `.next/static/chunks/*.css` bundle.
- [ ] `node docs/coursework/check-http.mjs` passes against an isolated disposable SQLite database.
- [ ] All commit hashes and test counts in `docs/coursework/*` and `docs/coursework/reviews/supanut/*` are consistent and accurately reflect which commit was tested.

