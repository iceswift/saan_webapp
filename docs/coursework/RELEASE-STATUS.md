# Coursework release status

Updated 7 November 2026. This file supersedes historical readiness statements in the audit, Kanban and review prompt. It is not final student acceptance.

## Baseline publication

The source through f96e64c is now published on `codex/coursework-baseline`, including 7b8ee93 (stylesheet contract) and 846b532 (shared PostCSS correction and query tests). This removes the source-access obstacle reported in Issue #8. Publication and owner integration do not count as a teammate review of those commits.

Fresh local verification on that application baseline: 69/69 integration tests, TypeScript, lint, direct Webpack production build, compiled-CSS check, and 9/9 session-backed HTTP scenarios passed. Evidence files are named `*-2026-11-07-baseline.*`. The HTTP harness created its own SQLite database with synthetic identities, loopback-only server and mock payments. No deployment or real payment was performed.

The first restricted build could not download Google Fonts. The subsequent default Turbopack attempt failed starting its PostCSS worker. The supported direct command `node node_modules/next/dist/bin/next build --webpack` passed. Do not claim a fresh default Turbopack pass. Lint initially included ignored local diagnostic scripts; ESLint now excludes generated `storage/` and `output/`, leaving source/configuration/tests in scope.

## Teammate evidence received

ikmie posted statements on Issues #4, #5 and #8 and closed those issues. These are real teammate-authored statements, not agent execution. They report requirements review, a UI-created journey with nine screenshots, and 65 integration plus 34 unit tests on the older available source. At the last inspection, the referenced REQUIREMENTS-FINDINGS.md, TEST-RESULTS.md, screenshots and raw logs were not available in the repository or linked from the comments. Treat the counts/journeys as teammate-reported until the artifacts can be inspected. Do not ask him to repeat old work just because our source was unpublished.

## Remaining work

- Investigate and correct the actual impossible-calendar-date boundary, with contract and retained failing/passing evidence.
- Verify stale product/provider/package eligibility and explicitly document repeated order submission semantics; do not confuse package/payment deduplication with order idempotency.
- Obtain the teammate's existing artifacts, reconcile differences and incorporate the actual evidence into the report.
- Update the English report and PDF after code integration and final evidence; verify every page and its navigation.
- Record genuine course-required peer review and final student acceptance separately from the owner's merge exception.
- `group_work_specs.docx` remains unavailable. Team scope and role allocation are confirmed; external course-theme/reuse requirements are not invented or waived by that team decision.

The owner authorized integration after checks, using the individual PR-only bypass documented in GITHUB-REVIEW-POLICY.md. That authorization is not approval to fabricate a course peer review or claim the report submission-ready. Keep production/cloud work separate from this Sprint 1 pass.
