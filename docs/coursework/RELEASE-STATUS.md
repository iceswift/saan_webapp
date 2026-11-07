# Coursework release status

Updated 7 November 2026. This file supersedes historical readiness statements in the audit, Kanban and review prompt. It is not final student acceptance.

## Baseline publication

The source through f96e64c is now published on `codex/coursework-baseline`, including 7b8ee93 (stylesheet contract) and 846b532 (shared PostCSS correction and query tests). This removes the source-access obstacle reported in Issue #8. Publication and owner integration do not count as a teammate review of those commits.

Fresh local verification on that application baseline: 69/69 integration tests, TypeScript, lint, direct Webpack production build, compiled-CSS check, and 9/9 session-backed HTTP scenarios passed. Evidence files are named `*-2026-11-07-baseline.*`. The HTTP harness created its own SQLite database with synthetic identities, loopback-only server and mock payments. No deployment or real payment was performed.

The first restricted build could not download Google Fonts. The subsequent default Turbopack attempt failed starting its PostCSS worker. The supported direct command `node node_modules/next/dist/bin/next build --webpack` passed. Do not claim a fresh default Turbopack pass. Lint initially included ignored local diagnostic scripts; ESLint now excludes generated `storage/` and `output/`, leaving source/configuration/tests in scope.

## Teammate evidence received

PR #14 merged 23 artifacts at 99171fd. The package includes requirements findings, test results, defect reports, raw logs and nine screenshots. Its AI-assisted execution used application commit 8492949. Supanut published the findings and the personal verification checklist remains blank. See reviews/supanut/EVIDENCE-INDEX.md.

## Boundary correction verified

The unchanged application accepted 2030-02-30 in a real session-backed create action. The prospective contract and regression were committed as a31e791 before correction. The schema now uses Zod's calendar-aware ISO date validator. The corrected Webpack build passed; all 13 HTTP scenarios and all 69 integration tests passed. The HTTP report retains file hashes because the implementation was tested as an uncommitted change on the contract commit. Match hashes rather than claiming that the contract commit contained the fix.

HTTP-10 rejects overflow dates, non-leap 29 February, invalid month/day and trailing text without order/item/event writes. HTTP-11 preserves real leap dates (including the Gregorian century rule), accepts Bangkok tomorrow and rejects Bangkok today. HTTP-12 verifies stale product, provider and package eligibility without writes. HTTP-13 documents existing repeated-submit behavior: two distinct unpaid orders, each with its own item/event snapshot; no payment occurs. A new idempotency contract or universal concurrent eligibility locking is not claimed.

## Remaining work

- Clarify whether the pre-existing Saan code is eligible for reuse (Issue #3). Theme selection is resolved below.
- Record the required substantive teammate reviews and sprint-staging integration. The GitHub review lists for PRs #10, #11 and #14 are empty.
- Record personal verification and acceptance by both students before submitting through LEB2.

## Integration and report update

PR #10 is merged at 3f536bf and PR #11 at 9377577. The application source proposed for assessment is 9377577047bf210c5e72da0cf7fbab5733451fa0, pending student acceptance. The updated 34-page report includes the PR #14 evidence package, captions and nine screenshots. Its application checks cite the tested source and keep the earlier browser evidence tied to 8492949. Word and PDF outputs are under output/coursework. Course acceptance remains pending the items above.

## Project board synchronized

Project #3 is populated with Issues #2–#9 and linked from the repository Projects page. The board view is Sprint 1 Kanban. Access was verified as iceswift Admin and ikmie Write, with private visibility. Current allocation: one Backlog, one In progress, six In review and zero Done. The Item closed automation was disabled after the template promoted pre-closed issues to Done; those three cards were returned to In review without reopening the teammate's issues. The screenshot under output/coursework/kanban-sprint-1.png is a working snapshot, not final release acceptance.

## Final technical rerun

Source tested: `4c55d7c5f665ced5909306f8cd8935b4ba111c76` (main after PR #15). This includes the proposed application source from PR #11 and the subsequently integrated evidence and report changes.

- `npm run typecheck`, `npm run lint`, and `node node_modules/next/dist/bin/next build --webpack` each exited successfully.
- `npm run test:integration` passed 69 of 69 tests with zero failures and zero skips.
- `node docs/coursework/check-css.mjs` passed BLD-AC-01. `node docs/coursework/check-http.mjs` passed 13 of 13 scenarios. See [HTTP results](evidence/http-closeout-2026-11-07.json).
- Playwright drove Chrome at 1280 × 900 on loopback with synthetic accounts and disposable SQLite data. It created an order through checkout, paid the simulated deposit, confirmed the appointment as the owning shop and reloaded it as the buyer. See [order created](evidence/sprint1-final-01-awaiting-deposit.png), [mock deposit paid](evidence/sprint1-final-02-deposit-paid.png), [shop confirmation](evidence/sprint1-final-03-shop-confirmed.png), and [buyer reload](evidence/sprint1-final-04-buyer-reload.png). This was an AI-assisted technical run. Independent student acceptance remains pending.

The PDF is the submission artifact. The DOCX is editable. Both are in `output/coursework/`. A later teammate review can document actual findings, while any acceptance of the existing merge order as a course exception belongs to the instructor. The supplied `group_work_specs_v1.pdf` is marked draft for instructor review, issued 6 October 2026. Pages 4 and 6 permit Theme 4 by Suwiwat’s ID ending in 4 and describe the e-commerce/ordering workflow that Saan specializes for shrine products and installation. The document does not explicitly settle eligibility to reuse the pre-existing code. Pages 1–2 require both students to participate across the project and allow unequal commit counts.