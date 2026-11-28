# Issue #48 local verification

Run on 29 November 2026 ICT using an isolated synthetic SQLite database and mock payments.
Staging base: 60be265. Prospective contract: 7ea527c.

## Red before the production code change

The first test run stopped at F05-AC-02 because the shared Lab 7 fixture had renamed the second shop. The fixture correction kept the two shops distinct. The second run reused the unchanged application built from 40638c3 and ran the corrected harness at 503764e.

Red harness SHA: 503764e855610dc597df724a4d48ea007a6971c7. Run time UTC: 11/28/2026 17:36:16.

F05-AC-01 and F05-AC-02 passed. F05-AC-03 rejected the pending shop quote write but failed on the pending shop GET. The response contained the synthetic private address. The fail-fast harness did not reach F05-AC-04 or HTTP-09 in this run.

    FAIL Forbidden response contains request address
    true !== false

## Green after the server read guard

Tested SHA: 6b82109b87286d80caea0a67717c730226f21f8e. Run time UTC: 11/28/2026 17:38:26.

Executed the Webpack production build, node docs/coursework/check-http.mjs, npm run test:integration and targeted ESLint. Build and lint succeeded. Integration: 69 passed, 0 failed, 0 skipped. HTTP: 20 passed, 0 failed, 0 skipped.

    {"test":"F05-AC-01","requestId":"cmx0p1w8q002iiehg138ounw6","status":"OPEN"}
    PASS F05-AC-01 validates and persists an owned repair request
    {"test":"F05-AC-02","requestId":"cmx0p1w8q002iiehg138ounw6","quotes":[{"id":"cmx0p1wa3002kiehglrrwtw8i","price":2590,"status":"SENT"},{"id":"cmx0p1wat002oiehgfa2l7s81","price":3490,"status":"SENT"}]}
    PASS F05-AC-02 persists two shops’ quotes and compares saved offers
    PASS F05-AC-03 denies forbidden reads and quote writes
    PASS F05-AC-04 closed requests leave the queue and reject quote changes
    RESULT 20 passed, 0 failed, 0 skipped

The source IDs above are synthetic database rows. The quote test asserted the same first quote ID after its update and found both offers on the rendered customer page. It also checked each provider page for its own quote and absence of the other quote note.

F05-AC-03 checks forbidden reads and rejects unverified, out-of-area, non-shop and invalid-price writes with quote and notification state preserved. F05-AC-04 verifies that closing a request hides it from the queue and prevents another quote change.

This is local evidence from built pages, real synthetic sessions, Server Actions and database assertions. Teammate review, staging integration and verification on the submitted candidate remain pending.
