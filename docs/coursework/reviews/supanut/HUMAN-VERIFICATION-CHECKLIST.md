# Human Verification Checklist (For Supanut Sopha, `67070503441`)

- **Reviewer:** Supanut Sopha (Student ID: `67070503441`)
- **Teammate / Implementation Author:** Suwiwat Sinsomboon (Student ID: `67070503444`)
- **Course:** CPE 334 Software Engineering — Project Deliverable 1
- **Reviewed Repository:** `https://github.com/iceswift/saan_webapp`
- **Reviewed Commit (`HEAD` / `origin/main`):** `849294959eeadd6ef88a8c8110c1ba3674b57925` (`8492949`)

> [!IMPORTANT]
> **Academic Integrity & Signoff Rule (Section 1.9 & Section 7):**
> All automated tests, browser CDP scenarios, and boundary probes documented in `TEST-RESULTS.md` were initially executed with AI assistance. Before signing off below, **Supanut Sopha (`67070503441`)** must personally repeat the spot-check steps and be ready to explain the 5 core engineering questions in Section 3 without relying on notes. All `Personally Repeated Result`, `Date/Time Repeated`, and `Reviewer Signature` fields are intentionally left blank for Supanut to complete.

---

## 1. Environment Preparation for Personal Spot-Check

Run these commands in PowerShell from `d:\saan_webapp` to start the application against the isolated disposable review database (`storage/review-supanut/review.db` — never production or shared data):

```powershell
$env:DATABASE_URL="file:D:/saan_webapp/storage/review-supanut/review.db"
$env:PAYMENT_PROVIDER="mock"
$env:APP_ENV="development"
$env:PAYMENT_MUTATIONS_DISABLED="false"
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000/login` in your browser.
- Synthetic Customer phone: `0800000002` (`ลูกค้า (ทดสอบ)`)
- Synthetic Verified Shop phone: `0800000003` (`ร้านศาลตัวอย่าง ก (ข้อมูลทดสอบ)`)
- Synthetic Unrelated Verified Shop phone: `0800000005` (`โรงงานศาลตัวอย่าง ค (ข้อมูลทดสอบ)`)
- Synthetic Pending Technician phone: `0800000004` (`ช่างตัวอย่าง ข (รออนุมัติ)`)

*(Never screenshot or paste the 6-digit test OTP banner or `saan_session` cookie into any coursework document.)*

---

## 2. Step-by-Step Human Verification Table

| Check ID | Verification Item | Steps for Supanut to Personally Repeat | Expected Outcome | AI-Assisted Pre-Check | Personally Repeated Result (`PASS`/`FAIL`) | Date / Time Repeated | Notes / Initials |
|---|---|---|---|---|---|---|---|
| **HV-01** | **Git Revision & Working Tree** | Run `git rev-parse HEAD` and `git status --short`. | Commit is `849294959eeadd6ef88a8c8110c1ba3674b57925` (or `f96e64c` once Suwiwat pushes coursework commits); `.env` is untracked. | PASS (`8492949`) | `[        ]` | `[              ]` | `[              ]` |
| **HV-02** | **Automated Test Suite** | Run `npm run typecheck` and `npm run test:integration`. | `tsc --noEmit` exits `0`; integration suite runs against `storage/tests/ci/money-test.db` with `65 pass, 0 fail` (or `69 pass` after `846b532`). | PASS (`65/65`) | `[        ]` | `[              ]` | `[              ]` |
| **HV-03** | **Customer Checkout & 30% Deposit Calculation** | Sign in as `0800000002`, open `ศาลพระภูมิเสามังกร` (`฿10,900`), add `พิธีตั้งศาลโดยพราหมณ์` (`฿3,500`), pick a future date (`พ.ศ.`), choose `บ้านพักอาศัย`, and submit. | Order is created in `AWAITING_DEPOSIT` with `total = ฿14,400` and `deposit = ฿4,320` (`30%`). | PASS | `[        ]` | `[              ]` | `[              ]` |
| **HV-04** | **Mock Deposit Payment & TrustNote** | On the new order page (`/orders/[id]`), verify the `โหมดทดสอบ ยังไม่มีการตัดเงินจริง` badge under the payment card, then click `จ่ายมัดจำ ฿4,320`. | Order status changes to `AWAITING_PROVIDER` (`รอร้านยืนยันและนัดวัน`) and records a single `PAID` deposit payment. | PASS | `[        ]` | `[              ]` | `[              ]` |
| **HV-05** | **Shop Blocked-Date Rejection (`Asia/Bangkok`)** | Sign in as `0800000003`, open `/provider/orders/[id]` for an `AWAITING_PROVIDER` order, open the `เลือกวันที่` calendar, and inspect the shop's blocked dates (18–20 Nov 2569). | Blocked dates are struck through (`aria-disabled="true"`, `"ร้านไม่ว่างวันนี้"`) and cannot be selected; server rejects any attempt to confirm on a blocked Bangkok date. | PASS | `[        ]` | `[              ]` | `[              ]` |
| **HV-06** | **Shop Schedule Confirmation & Customer Reload** | As `0800000003`, select an open future date and time (`09:00`), click `ยืนยันรับงาน`. Then sign back in as `0800000002`, open `/orders/[id]`, and reload (`F5`). | Order transitions to `CONFIRMED` (`ร้านนัดเข้างาน ...`) and persists across full page reload. | PASS | `[        ]` | `[              ]` | `[              ]` |
| **HV-07** | **Ownership Restriction (404 on Unrelated Account)** | Copy the `/provider/orders/[id]` URL of Shop A's order, sign in as unrelated shop `0800000005`, and visit that URL. | Renders 404 (`ไม่พบหน้านี้`); does not leak customer address, phone number, or notes. | PASS | `[        ]` | `[              ]` | `[              ]` |
| **HV-08** | **Logout & Protected Route Redirect** | Click `ออกจากระบบ` on `/account`, then paste the previous `/orders/[id]` URL into the address bar. | Browser redirects (`307`) to `/login?next=%2Forders%2F...` and requires re-authentication. | PASS | `[        ]` | `[              ]` | `[              ]` |
| **HV-09** | **Inclusive Design (Validate-on-Press & Large Text)** | On `/new/checkout?productId=...`, click `ยืนยันคำสั่งซื้อ` without picking a date; then toggle large text in `/settings/display` and resize viewport to `360px` wide. | Submit button is not disabled; pressing it focuses `#date` and shows red `FieldHint` text; no horizontal scrollbar at `360px` width. | PASS | `[        ]` | `[              ]` | `[              ]` |

---

## 3. Oral Defense & Viva Explanation Notes for Supanut (Section 7)

Be ready to explain these five architectural points in your own words during the coursework review:

### 3.1 Where does the order total and 30% deposit come from?
- **Code Reference:** `src/server/actions/orders.ts` (`L72-L135`) and `src/lib/constants.ts` (`DEPOSIT_RATE = 0.3`).
- **Explanation:** The client checkout form (`src/app/new/checkout/checkout-form.tsx`) only displays an estimate (`PriceTicker`) for UX and sends `{ productId, packageIds, ... }` to `createInstallOrder`. The server never trusts client prices: it queries `db.product.findFirst({ where: { id: data.productId, active: true } })` and `db.servicePackage.findMany({ where: { id: { in: uniquePackageIds }, providerId: product.providerId, active: true } })`, sums `total = product.price + packages.reduce(...)`, calculates `deposit = Math.round(total * 0.3)`, and copies each item's `name` and `price` into `OrderItem` rows so future catalog price changes never alter existing orders.

### 3.2 How is the `Asia/Bangkok` date boundary enforced when a shop confirms an appointment?
- **Code Reference:** `src/server/provider-order-service.ts` (`L20-L26`, `L69-L79`).
- **Explanation:** When a shop confirms an order with an ISO timestamp (`scheduledAt`), the server parses it into a `Date`, checks `parsed.getTime() > now.getTime()`, and formats it via `new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed)` to get `yyyy-mm-dd` in Thailand time (`UTC+7`). Even if the appointment is at `00:30` Bangkok time (which is `17:30` on the *previous* UTC day), `formatDateInBangkok` maps it to the correct Bangkok calendar date and checks `db.providerBlockedDate.findUnique({ where: { providerId_date: { providerId: provider.id, date: scheduledDateInBangkok } } })`.

### 3.3 How is order ownership enforced on both read queries and write mutations?
- **Code Reference:** `src/server/queries.ts` (`L227-L295`), `src/app/orders/[id]/page.tsx` (`L35-L41`), `src/app/provider/orders/[id]/page.tsx` (`L29-L36`), `src/server/payment-service.ts` (`L84-L86`), and `src/server/provider-order-service.ts` (`L56-L61`).
- **Explanation:**
  - **Reads:** `getOrder(id, viewer)` loads the order and checks `const isCustomer = order.userId === viewer.id; const isProvider = Boolean(viewerProvider && order.providerId === viewerProvider.id);`. If the viewer is neither the owning customer, the owning provider, nor an `ADMIN`, `getOrder` returns `null` and the page calls `notFound()`. Additionally, `/orders/[id]` blocks providers from viewing the customer URL (`if (order.viewerIs === "PROVIDER") notFound()`), and `/provider/orders/[id]` blocks customers (`if (order.viewerIs !== "PROVIDER") notFound()`).
  - **Mutations:** Every mutation independently checks ownership in the service layer (`order.userId !== input.userId` in `runCustomerPayment` / `cancelCustomerOrder`; `order.providerId !== provider.id` in `confirmProviderOrder` / `declineProviderOrder` / `completeProviderOrder`) before executing a conditional `updateMany` inside `db.$transaction`.

### 3.4 What happens on logout and when revisiting a protected route?
- **Code Reference:** `src/server/auth.ts` (`L68-L82`, `L137-L144`) and `src/server/actions/auth.ts` (`L103-L107`).
- **Explanation:** Calling `logout()` invokes `destroySession()`, which deletes the `Session` row (`db.session.deleteMany({ where: { id: sid } })`) from SQLite and deletes the HTTP-only `saan_session` cookie. When the user revisits `/orders/[id]`, `requireUser(nextPath)` calls `getCurrentUser()`, sees no valid session, and throws Next.js `redirect("/login?next=%2Forders%2F...")` (HTTP `307`).

### 3.5 What are the limits of our test evidence on commit `8492949`?
- **Explanation:**
  1. **Mock Payment vs Real Gateway:** All deposit payments in local review used `PAYMENT_PROVIDER=mock` (`IS_MOCK_PAYMENT = true`), which simulates instant PromptPay confirmation in SQLite without calling Omise or moving real money.
  2. **Server-Side Input Boundaries Found (`DEF-001`..`DEF-004`):** While the UI calendar blocks impossible dates and double-clicks, direct Server Action calls can still pass regex-matching impossible calendar dates like `2027-02-31` (`DEF-001`) or create duplicate unpaid orders under concurrent POSTs (`DEF-002`).
  3. **Commit Sync Gap (`DEF-005`):** Our local checkout and `origin/main` are at `8492949` (65 integration tests), whereas Suwiwat's later coursework commits (`7b8ee93`, `846b532`, `f96e64c` with 69 integration tests and `docs/coursework/*`) still need to be pushed/merged so the repository and written report match.

---

## 4. Final Human Reviewer Signoff (To Be Completed by Supanut Sopha)

- **Reviewer Name:** Supanut Sopha
- **Student ID:** `67070503441`
- **Reviewed Commit Hash Verified Personally:** `[                                        ]`
- **Number of Manual Checks Personally Repeated (`HV-01`..`HV-09`):** `[     / 9 ]`
- **Overall Reviewer Decision (`APPROVED` / `APPROVED WITH RESERVATIONS` / `CHANGES REQUESTED`):** `[                              ]`
- **Signature / Initials:** `[                    ]`
- **Signoff Date:** `[                    ]`

