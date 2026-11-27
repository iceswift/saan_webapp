# Lab 7 verification record

## A. Decision and versions

The 24 November course announcement waives instructor/TA signoff. Issue #39 records the team-selected rule. Supanut's substantive peer review of 961c9fb is in PR #43 before implementation. Quevo reported five passes on declared UAT commit f1aa542 and revision saan-uat-00001-5nm. Formal Sprint 1 acceptance remains pending.

| Purpose | SHA |
| --- | --- |
| Pre-change staging behavior | 27b22c1 |
| Additive schema only with default 1 | 9a9302b |
| Red assertion with old booking behavior | 624412a |
| Behavior implementation | 101284d |
| Additional ownership and existing-order checks | 87f791a |
| Repeatable fixed-clock fixture implementation | 4dd2a10 |

## B. Executed checks

- Red and green use a production Next.js build, the same L7-T03 assertion, synthetic SQLite fixtures, mock payments and a frozen instant of 2026-12-31 17:30 UTC (1 January 2027 in Bangkok).
- Red at 624412a, with only additive storage and a test change relative to the reviewed code: for a shop configured to 3 days, 2 January was accepted and produced 1 order, 2 order items and 1 event. The assertion failed because the old action accepted the early date. The direct SQLite fixture sets the lead time before submission.
- Green on the implementation with the repeatable harness: 2 January and the mixed 3/4 January submission were rejected with zero writes. 4 January was accepted and its date persisted. The HTTP suite passed 16/16 with zero failures or skips.
- The same suite verifies default-1 booking, valid owner settings, invalid values, customer/anonymous denial, pending-shop denial, another shop's inability to mutate the target shop, and the ability to pay and confirm a D+1 order after raising the minimum to 5.
- Local regression: npm run test:unit 34/0/0; npm run test:integration 69/0/0 (pass/fail/skip). npm run lint, npm run typecheck, npm run db:postgres:check and npm run build passed.
- Harness diagnosis: an absolute Windows preload path failed to load on the first red attempt. The relative preload reached the booking assertion. An initial green attempt hit the fixed-clock fixture directory reuse guard. The harness now creates a unique directory per run. Those setup failures are not used as behavior evidence.

Build with npm run build. In PowerShell, then run:

    $env:NODE_OPTIONS='--require=./docs/labs/lab-07/test-clock.cjs'
    $env:COURSEWORK_HTTP_REPORT='storage/lab7-http.json'
    node docs/coursework/check-http.mjs
    Remove-Item Env:NODE_OPTIONS

Use the same preload content at the red commit. It fixes time in both the harness and the inherited loopback Next.js process.

## C/D. Release and submission status

Local regression evidence is available. Staging review, main release, Cloud Run traffic and post-deployment behavior checks remain pending. Current readiness for the maintained Sprint 1 release is NOT READY until those checks complete. Verify the serving revision and exercise the setting, early-date rejection, persisted eligible booking and preserved customer/provider path with synthetic accounts. Refresh the five metrics after candidate CI and release. Record actual issue/PR/run IDs and results, including any failed or skipped checks. Fill the final PDF with the resulting reviewed and deployed evidence.
