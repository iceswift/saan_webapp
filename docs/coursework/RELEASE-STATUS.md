# Coursework release status

Updated 7 November 2026. This file supersedes historical readiness statements in the audit, Kanban and review prompt. It is not final student acceptance.

## Baseline publication

The source through f96e64c is now published on `codex/coursework-baseline`, including 7b8ee93 (stylesheet contract) and 846b532 (shared PostCSS correction and query tests). This removes the source-access obstacle reported in Issue #8. Publication and owner integration do not count as a teammate review of those commits.

Fresh local verification on that application baseline: 69/69 integration tests, TypeScript, lint, direct Webpack production build, compiled-CSS check, and 9/9 session-backed HTTP scenarios passed. Evidence files are named `*-2026-11-07-baseline.*`. The HTTP harness created its own SQLite database with synthetic identities, loopback-only server and mock payments. No deployment or real payment was performed.

The first restricted build could not download Google Fonts. The subsequent default Turbopack attempt failed starting its PostCSS worker. The supported direct command `node node_modules/next/dist/bin/next build --webpack` passed. Do not claim a fresh default Turbopack pass. Lint initially included ignored local diagnostic scripts; ESLint now excludes generated `storage/` and `output/`, leaving source/configuration/tests in scope.

## Teammate evidence received

ikmie posted statements on Issues #4, #5 and #8 and closed those issues. These are real teammate-authored statements, not agent execution. They report requirements review, a UI-created journey with nine screenshots, and 65 integration plus 34 unit tests on the older available source. At the last inspection, the referenced REQUIREMENTS-FINDINGS.md, TEST-RESULTS.md, screenshots and raw logs were not available in the repository or linked from the comments. Treat the counts/journeys as teammate-reported until the artifacts can be inspected. Do not ask him to repeat old work just because our source was unpublished.

## Boundary correction verified

The unchanged application accepted 2030-02-30 in a real session-backed create action. The prospective contract and regression were committed as a31e791 before correction. The schema now uses Zod's calendar-aware ISO date validator. The corrected Webpack build passed; all 13 HTTP scenarios and all 69 integration tests passed. The HTTP report retains file hashes because the implementation was tested as an uncommitted change on the contract commit. Match hashes rather than claiming that the contract commit contained the fix.

HTTP-10 rejects overflow dates, non-leap 29 February, invalid month/day and trailing text without order/item/event writes. HTTP-11 preserves real leap dates (including the Gregorian century rule), accepts Bangkok tomorrow and rejects Bangkok today. HTTP-12 verifies stale product, provider and package eligibility without writes. HTTP-13 documents existing repeated-submit behavior: two distinct unpaid orders, each with its own item/event snapshot; no payment occurs. A new idempotency contract or universal concurrent eligibility locking is not claimed.

## Remaining work

- Integrate the verified date correction and retain the real failing/passing action evidence. Stale eligibility and sequential repeated-submit behavior are now checked; broader concurrent-create guarantees are not introduced.
- Obtain the teammate's existing artifacts, reconcile differences and incorporate the actual evidence into the report.
- Update the English report and PDF after code integration and final evidence; verify every page and its navigation.
- Record genuine course-required peer review and final student acceptance separately from the owner's merge exception.
- `group_work_specs.docx` remains unavailable. Team scope and role allocation are confirmed; external course-theme/reuse requirements are not invented or waived by that team decision.

The owner authorized integration after checks, using the individual PR-only bypass documented in GITHUB-REVIEW-POLICY.md. That authorization is not approval to fabricate a course peer review or claim the report submission-ready. Keep production/cloud work separate from this Sprint 1 pass.

## Integration and report update

PR #10 is merged at 3f536bf and PR #11 at 9377577. The application source proposed for assessment is 9377577047bf210c5e72da0cf7fbab5733451fa0, pending student acceptance. The English report has been rebuilt to 29 pages with current boundary evidence, actual owner integration and received teammate comments. All 29 rendered pages were visually inspected; after three final wording corrections, the three changed pages were inspected again and the other 26 PNGs were byte-identical. The structural checker passed page count, navigation, both identities, current tested source hashes and DOCX/PDF fingerprints. Output remains under ignored output/coursework; report authoring source and verification metadata are versioned here.

The packaged DOCX renderer was attempted but has no LibreOffice on this host. Hidden Word PDF export and bundled Poppler rasterization were used, matching the prior verified fallback. Final course submission readiness is still not claimed: the teammate artifact receipt, substantive course process and both students' acceptance remain outstanding.
