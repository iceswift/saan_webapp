# Saan independent coursework review prompt

Copy this entire file into Antigravity, or ask Antigravity to read it in the Saan checkout and perform the review below.

## Your assignment

Help **Supanut Sopha, 67070503441**, independently verify Saan for **CPE 334 Project Deliverable 1**. Work locally on Supanut's computer. Private Tailscale staging is unavailable to him and is not required for this review. Do not attempt to expose or access the home server.

Saan is a Thai-language marketplace for shrine products and services. Keep review documents in English; do not translate or redesign the application during the review.

Repository: <https://github.com/iceswift/saan_webapp>

The team allocation is:

- **Suwiwat Sinsomboon, 67070503444:** application development, integration and technical fixes.
- **Supanut Sopha, 67070503441:** requirements review, test design and execution, reproducible defect reports, substantive peer review and report verification.

You are a verification assistant. AI-generated execution and analysis must be identified as AI-assisted. Supanut must reproduce important results, inspect findings and understand the evidence before accepting it. Do not approve a PR or sign a contribution record on his behalf.

## 1 Verify the source before making claims

1. Use a separate local checkout for this review. Preserve existing work and never reset or clean another working tree.
2. Read `AGENTS.md` and applicable repository instructions. Before proposing Next.js code changes, consult the installed version's guides under `node_modules/next/dist/docs/`.
3. Record `git rev-parse HEAD`, `git status --short`, the date, OS and Node/npm versions.
4. Confirm the checkout contains:
   - `docs/coursework/README.md`
   - `docs/coursework/TEAM-VERIFICATION-WORKBOOK.md`
   - `docs/coursework/VERIFICATION-ADDENDUM.md`
   - `docs/coursework/BUILD-CONTRACT.md`
   - `docs/coursework/check-http.mjs`
   - `tests/coursework-queries.integration.test.ts`
5. Reference history includes stylesheet contract `7b8ee93`, correction and regression checks `846b532`, and expanded report source `f96e64c`. A newer revision is acceptable, but record its identity and differences. Do not assume the remote already contains these local commits.
6. If the required files or commits are missing, request the latest source package or published revision from Suwiwat. Do not reconstruct absent evidence or treat the older remote as the newer reviewed version.
7. Read the English report if provided. Generated DOCX/PDF files are ignored outputs, so they may be supplied separately rather than exist in the checkout.
8. The course master specification `group_work_specs.docx` has not been verified in this workspace. If unavailable, disclose that assigned-theme and existing-project reuse compliance cannot be established from this prompt alone.

## 2 Prepare a local synthetic environment

Read `.env.example`, `README.md` and the test runners before executing commands. Use the lockfile with `npm ci`; do not upgrade dependencies or apply `npm audit fix --force` during the review.

For manual UI work, create a **new disposable local SQLite database** in this separate checkout. Before running `db:push` or seed, verify the effective `DATABASE_URL` points to that new local file. Never use a PostgreSQL connection, existing application database, inherited production credentials or another person's `.env` file. Do not overwrite an existing `.env`; inspect its intended configuration without exposing secrets.

Use local development with mock payment only. Explicitly set `PAYMENT_PROVIDER=mock`, `APP_ENV=development` and `PAYMENT_MUTATIONS_DISABLED=false` in the local demo environment. Keep real gateway credentials absent. If another runtime setting conflicts, resolve it using the source and report the decision. Do not modify staging or production settings.

The usual local sequence, after validating the isolated database and configuration, is:

```text
npm ci
npm run db:push
npm run db:seed
npm run dev
```

Seed only this new local database. Inspect `prisma/seed.ts` to confirm actual accounts and records. The local README documents customer `0800000002` and verified provider `0800000003`; do not assume they exist in an unseeded environment. A test code is displayed in the restricted local login flow; no real SMS is required. Never include OTP or session token values in the review output.

Do not add packages, change application code, deploy, publish, delete existing records or change network access during the initial review. If setup requires an application fix, describe the exact blocker first. Routine setup within the fresh local review workspace is part of this task.

## 3 Review requirements against implementation

Review report Parts A, B, C and E and inspect the actual source, especially:

```text
src/server/actions/auth.ts
src/server/auth.ts
src/server/actions/orders.ts
src/server/actions/provider.ts
src/server/provider-order-service.ts
src/server/payment-service.ts
src/server/queries.ts
prisma/schema.prisma
tests/coursework-queries.integration.test.ts
tests/provider-orders.integration.test.ts
tests/otp.integration.test.ts
```

Check the following rules and their FR/BR/AC links:

- Identity comes from a real server session. The browser cannot select an arbitrary user ID or role.
- Any signed-in account may buy for itself. Shop management still requires the owning verified provider.
- Order totals come from active products and same-shop packages on the server. The current deposit rate is 30 percent, rounded by the implementation.
- Duplicate package IDs must not inflate the total. Persisted item prices must survive subsequent catalog price changes.
- Preferred dates must be future Bangkok dates and include an available day. Confirmation requires a future appointment on an open Bangkok day.
- A successful test deposit advances the order before shop confirmation. Displaying a QR does not prove payment success.
- Rejected operations must preserve the required stored state. Distinguish duplicate package selection, duplicate order submission and duplicate payment processing; they are different concerns.
- A hidden button is not backend authorization. A service/query test is not automatically a cookie-authenticated HTTP test or a full browser journey.

Known open verification boundaries include impossible calendar dates, stale product eligibility at order submission and duplicate order submission. Investigate and report actual behavior; do not assume these are either fixed or confirmed defects without evidence.

Do not add a 14-day production lead time, manufacturing dimensions or crane-zone rules merely because they appeared in an earlier AI proposal. They are not agreed Saan requirements.

## 4 Run and inspect automated verification

Use the commands actually supported by the checked-out source. Relevant commands are:

```text
npx next typegen
npm run typecheck
npm run test:integration
npm run build
node docs/coursework/check-css.mjs
node docs/coursework/check-http.mjs
```

Important execution details:

- The integration runner forces a separate SQLite `money-test.db`. Read its guard and verify it remains intact. Do not run writable suites concurrently against the same database.
- Run the CSS check after a successful build. Compilation alone does not prove Tailwind output or usable layout.
- `check-http.mjs` requires that build's server-action manifest. It creates a new local database and launches a loopback-only server on port 3201 with synthetic test accounts and mock payments. Ensure the port is free; never terminate an unrelated service to free it.
- The HTTP script uses generated action identifiers from its own build. These are not stable public API endpoints.
- Both default and direct Webpack builds passed in the prior recorded review. If the local default build fails, retain that failure before investigating. The explicit alternative is `node node_modules/next/dist/bin/next build --webpack`; report each attempt separately.
- Prior evidence recorded **69 integration cases and 9 HTTP scenarios**. These are historical reference counts, not the result of your new run. Report actual current counts and explain differences.
- Inspect meaningful setup and assertions, especially blocked-day rollback and ownership denial. Do not merely quote a green summary.
- Disclose every failed or skipped required check. Do not delete tests, weaken assertions, fabricate red/green history or relabel an old log as a fresh execution.

## 5 Execute the selected browser journey

Use the detailed procedures in `TEAM-VERIFICATION-WORKBOOK.md`. Record each scenario's version, role, fixture, steps, expected result, actual result and evidence.

1. **Normal journey:** customer login, select an eligible product, submit an installation order, complete the mock deposit, sign in as the owning shop, confirm an open future appointment, then sign back in as the customer and retrieve the saved result after reload.
2. **Business rejection:** attempt confirmation on a shop-blocked Bangkok day. Verify the rejection and compare persisted status, appointment and relevant event/notification counts before and after.
3. **Ownership restriction:** use an unrelated synthetic buyer and provider against the same private order. Verify no private address or note is returned and forbidden actions cannot mutate the order. Use documented synthetic fixtures; do not alter real accounts.
4. **Logout:** log out, revisit a protected URL and verify that a fresh request is no longer authorized. Distinguish browser memory from a newly authorized server response.
5. **Usability:** check error recovery, keyboard focus, loading state, narrow layout and large text in the selected flow. Do not claim untested devices or accessibility certification.

Take readable screenshots of relevant outcomes. Exclude `.env`, credentials, OTPs, session tokens and unrelated private records. Screenshots must show real execution, not AI-generated mockups. English captions may accompany the Thai UI.

## 6 Write the review outputs in English

Save your new work under `docs/coursework/reviews/supanut/`, preserving existing evidence. Use descriptive filenames and do not overwrite another reviewer's findings.

### Review summary

State the reviewed source revision and working-tree state, environment, actual checks, principal findings and remaining limitations. Distinguish AI-assisted execution from checks Supanut personally repeated.

### Requirements findings

For each finding, identify the FR/BR/AC, the ambiguous or unsupported claim, the actual source or behavior, and a suggested clarification. Distinguish confirmed defect, suspected defect and unverified concern.

### Test results table

```text
Test ID | Revision and environment | Role and preconditions | Steps |
Expected | Actual | PASS / FAIL / NOT RUN | Evidence reference |
Executed by AI or personally repeated by Supanut
```

### Defect reports

Record severity and its reason, reproducible steps, expected and actual behavior, observed stored-state effects, verified file/line where appropriate, and screenshot/log references. Include no secrets. Do not invent findings to fill a quota; a clearly evidenced pass is useful too.

### Peer review preparation

List concrete questions and checks Supanut can use on a real PR. Record a genuine review only when Supanut actually inspects and submits it. Do not create Issues, post comments, publish reviews, approve PRs or impersonate either student without a separate explicit request.

### Human verification checklist

Identify the important results Supanut should reproduce and explain personally. Include the price source, Bangkok date boundary, ownership enforcement, logout behavior and limits of the test evidence. Leave human result/signoff fields empty until he completes them.

## Completion standard

Finish with a clear account of what was inspected, what was executed, what passed or failed and what remains unverified. Provide actionable findings, not a blanket claim that the project is complete or ready for submission. Course approval, substantive teammate review and final human release acceptance cannot be manufactured by AI.
