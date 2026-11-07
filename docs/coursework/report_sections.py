"""Detailed report sections; factual gaps remain explicit and attributable."""

def section_a(page, para, sub, table, code):
    page('Part A', 'Quality targets and scope decisions')
    table(['ID and sprint', 'Acceptance target', 'Verification and limit'], [
        ('NFR-01 / 1', 'Zero private address, note or message fields in selected unrelated-user responses.', 'CQ-04 verifies query denial; HTTP-06 verifies actual session-backed routes and actions. Browser excerpts supplement these assertions.'),
        ('NFR-02 / 1', 'A rejected confirmation changes no status, schedule, event or notification; repeated confirmation adds no duplicate side effects.', 'Real database transactions with persisted before and after assertions. Race test expects exactly one accepted transition.'),
        ('NFR-03 / 3', 'Controls target 44 CSS pixels; document width does not exceed 325 CSS pixels with normal and large text in selected flows.', 'Measure keyboard, focus and geometry in both themes. Physical devices and participant testing are still required.'),
        ('NFR-04 / 1', 'A clean local setup reproduces synthetic data; every reported check has a command, source identity and outcome.', 'Record install, schema, seed, typecheck, test and build output. A failed build remains failed until resolved and rerun.'),
        ('NFR-05 / 3', 'An isolated restore preserves selected record counts and upload hashes and refuses an occupied target.', 'Dated historical restore evidence exists; a course release must identify its applicable schema and backup.'),
    ], [2.8,6.8,7.6])
    sub('Assumptions and recorded decisions')
    para('DEC-01: Saan is the product of record. The teammate shrine-store draft supplies context only. DEC-02: any signed-in account may buy for itself; a provider does not need a separate customer account. Provider-management actions remain limited to the owning verified shop. This matches existing code and avoids inventing a customer-only guard.')
    para('DEC-03: use mock payment for a self-contained demonstration. Test provider collection may be studied separately, but no real money or external account is needed. DEC-04: preserve the original Git history and distinguish existing code from new course work. DEC-05: Supanut focuses on requirements and verification; Suwiwat leads implementation and integration.')
    sub('Open decisions and acceptance impact')
    para('OD-01: Theme 4 selected under Group Work Specification v1, pp. 4 and 6. OD-02: eligibility to reuse the existing code remains open. OD-03: student acceptance of the proposed immutable release and substantive teammate review remain open.')

def section_c_data(page, para, sub, table, code):
    page('Part C', 'Extended data dictionary and ownership')
    para('The diagram emphasizes Sprint 1. The whole-product SDS also accounts for the following entities. Identifiers are Prisma-generated strings unless noted. Status values are stored as strings, so application validation and conditional updates are material safeguards rather than database enums.')
    table(['Entity group', 'Relationships and important fields', 'Constraint and ownership'], [
        ('Identity', 'User.phone, role; Session.token, userId, expiresAt; OtpCode.phone, code, attempts, consumedAt.', 'Unique phone and session token. A session resolves its user server-side. OTP lifetime and attempts are service rules.'),
        ('Catalog', 'Provider.userId, status, areas; Product.providerId, kind, price, active; ServicePackage.providerId, type, price, active.', 'One Provider per owner. Order items must resolve to the chosen provider. Prices are whole baht.'),
        ('Appointments', 'ProviderBlockedDate.providerId plus date; Order.preferredDates and scheduledAt.', 'Unique provider and date. Preferred dates are JSON text; appointments are DateTime. Calendar checks use Bangkok.'),
        ('Orders', 'Order.userId, providerId, shrineId, requestId, total, deposit; OrderItem.productId or packageId; OrderEvent.byRole.', 'Unique order code and optional requestId. Item names and prices are snapshots; order customer and shop are separate links.'),
        ('Service requests', 'ServiceRequest.userId, shrineId, type, description, site and status; Quote.requestId, providerId, price and status.', 'Unique request and provider pair prevents duplicate quote records from the same shop. Request ownership is explicit.'),
        ('Personal records', 'Shrine.userId, location, installedAt; Vow.userId, promise, status, remindAt; Address.userId and isDefault.', 'Customer-owned records are private. Public shop coordinates must never be inferred from these locations.'),
        ('Work records', 'CareLog.shrineId, doneAt; Review.orderId, userId, providerId, rating; OrderMessage.orderId and senderId.', 'One review per order; eligibility and rating bounds are application rules. Messages require order participation.'),
        ('Notifications', 'Notification.userId, kind, href and readAt.', 'Indexed by userId and readAt; unread counts and rows must be scoped to the same owner.'),
        ('Payment journal', 'Payment.orderId, kind, amount, status; MoneyOperation.key, orderId, amountMinor, gatewayRef and status.', 'Unique operation key. Legacy payment amount is baht; operation amount is integer satang. Referenced journal deletion is restricted.'),
        ('Settlement support', 'PaymentPool; PayoutAttempt.operationId; RefundCase.operationId; RefundCaseEvent.caseId; MockGatewayReceipt; ProviderWebhookEvent.', 'Operation and reference uniqueness support deduplication. These broader sandbox records are outside Sprint 1 financial acceptance.'),
    ], [3.2,7.6,6.4])
    para('Local SQLite schema is prisma/schema.prisma. PostgreSQL schema and migration files live in prisma/postgresql. Preserve their synchronization and additive migration history. This document introduces no migration or change to retained business data.')

def section_c_ui(page, para, sub, table, code):
    page('Part C', 'Screen and application interaction contracts')
    table(['Screen or boundary', 'Normal interaction', 'Empty error and recovery'], [
        ('/login', 'Normalize phone input, request a restricted test code, verify and return to a safe local destination.', 'Invalid or expired code remains an error. Resend replaces the challenge. Do not expose a test code as production identity proof.'),
        ('/browse and /products/[id]', 'Search or filter eligible products, open detail, inspect price and choose the next action.', 'Show no-match state and reset filters. An unavailable item cannot be ordered from a stale page.'),
        ('/new/checkout', 'Choose site details, supported area and preferred dates, then submit the installation action.', 'Validate on press, expose field hints and focus the first invalid control. Keep entered data while correcting it.'),
        ('/orders and /orders/[id]', 'List own work and retrieve saved details. Present one next action for the current state.', 'Unauthenticated users must log in. Unrelated authenticated users receive no private projection. A missing record is not a blank successful order.'),
        ('/provider', 'Resolve the signed-in owner’s shop, then confirm an assigned order with date and time.', 'Reject unverified shop, wrong owner, blocked day or stale state. Re-read the current state after a conflict.'),
        ('Application action result', 'Use {ok:true,data:T} for success and {ok:false,error:string} for a rejected operation.', 'Expected failures are not raw database exceptions. Screens preserve a useful error and re-enable the action.'),
    ], [4.2,6.4,6.6])
    sub('Transport and trust boundary')
    para('Next.js transports Server Actions through framework-managed POST requests. Action identifiers are generated build artifacts, not stable REST routes. Tests should exercise the action through its rendered UI or an appropriate request context. Service functions that accept a userId are internal contracts; only authenticated wrappers may supply that identity in the normal application path.')
    sub('Shared interaction policy')
    para('Use Thai dates, large actions and inline validation in the application. Loading prevents repeated in-flight work; missing data should trigger explanation rather than a permanently disabled primary action. Focus must remain visible and return after dismissing a dialog. Color alone must not communicate a status. These conventions are design requirements; selected historical checks do not establish every screen or device as verified.')
    sub('Secrets and stored state')
    para('Do not send server secrets to the browser or include them in screenshots, URLs or report logs. Use synthetic records for evidence. Keep session cookies HttpOnly and avoid displaying their values in the report. The private staging URL is not a substitute for a documented local setup.')

def section_e_boundaries(page, para, sub, table, code):
    page('Part E', 'Order boundaries and verification responsibilities')
    table(['Input or condition', 'Expected behavior', 'Evidence obligation'], [
        ('Product inactive or shop not verified', 'Reject submission; public detail also becomes unavailable.', 'CQ-01 covers queries. HTTP-12 now verifies actual stale product/provider rejection without writes.'),
        ('Package belongs to another shop', 'Reject the entire request; never charge for a partially accepted selection.', 'HTTP-05 passed the actual rejected action with unchanged order count. HTTP-04 supplies a same-shop control.'),
        ('Duplicate package IDs', 'Deduplicate before pricing; do not add the same package twice.', 'HTTP-04 passed: one package counted once, total 1100, deposit 330 and two order items.'),
        ('Unsupported area or outside radius', 'Reject when applicable; optional coordinates do not imply GPS consent.', 'Test area rejection and radius boundary with synthetic coordinates. Do not infer real customer location.'),
        ('No dates or more than three', 'Schema rejection before persistence.', 'Assert returned failure and unchanged order count. Inspect focused field in the UI.'),
        ('Today past date or all days blocked', 'Reject; require future Bangkok dates and at least one open preference.', 'Clock-aware boundary cases and zero new records. Confirmed appointments use a separate future-time check.'),
        ('Malformed or impossible date', 'Reject impossible calendar values before persistence.', 'Corrected through PR 11 after actual failing HTTP regression; HTTP-10/11 verify rejection and valid leap/tomorrow controls.'),
        ('Catalog price changes after purchase', 'Persisted item and order amounts do not silently change.', 'CQ-03 passed stored snapshot assertions. HTTP-04 separately passed server-side action pricing and persistence.'),
        ('Another user reads the order', 'No private address, note or messages returned.', 'CQ-04 and HTTP-06 passed query and session denial. VIS-03 shows the unrelated-account browser result.'),
    ], [4.1,6.3,6.8])
    sub('No migration and no hidden new business rule')
    para('The documentation and additional query tests do not alter the schema, deposit policy, cancellation rights or shop dates. F-03 accepts a signed-in buyer of any role. The report does not assert a 14-day production lead time, custom dimensions or crane zones merely because they appeared in the earlier AI proposal.')
    sub('Failure handling and future correction')
    para('An uncovered boundary remains an identified test obligation. If it fails, preserve that real failure, agree the intended behavior and correct it under a prospective contract. Do not weaken assertions or rename an untested boundary as a pass. New implementation work belongs in a genuine reviewed change, not in a fabricated history.')

def section_f_coverage(page, para, sub, table, code):
    page('Part F', 'Detailed acceptance coverage and remaining checks')
    table(['AC and planned test', 'Actual executable evidence', 'Result and remaining scope'], [
        ('AC-01 / TEST-01', 'HTTP-03 uses a real challenge and session; selected browser login checked.', 'Passed server-established seeded identity and protected retrieval. Full UI creation journey still separate.'),
        ('AC-02 / TEST-02', 'OTP integration cases plus HTTP-02 invalid verification.', 'Passed service boundaries and no session on wrong-code action. No production SMS claim.'),
        ('AC-03 / TEST-03', 'HTTP-01 and HTTP-09; browser logout and protected navigation.', 'Passed stored-session deletion and denied replay; explicit login redirect verified, including streaming transport.'),
        ('AC-04 / TEST-04', 'coursework-queries.integration.test.ts: CQ-01 and CQ-02.', 'Passed: active verified catalog, filters, stale verification and same-shop active package projection. UI evidence pending.'),
        ('AC-05 / TEST-05', 'CQ-03 plus HTTP-04 actual createInstallOrder.', 'Passed buyer identity, deduplicated packages, total 1100, deposit 330, two items and initial event; saved route retrieval verified.'),
        ('AC-06 / TEST-06', 'HTTP-05 and HTTP-10/11/12 actual createInstallOrder calls.', 'Passed invalid inputs, real calendar rejection, Bangkok today/tomorrow and stale eligibility without writes; see current evidence update.'),
        ('AC-07 / TEST-07', 'CQ-04 plus HTTP-06 and unrelated-user browser check.', 'Passed query and actual session route denial: no private address or note for unrelated buyer/provider.'),
        ('AC-08 / TEST-08', 'Duplicate-deposit integration case plus HTTP-07.', 'Passed mock deposit action twice with one paid record and AWAITING_PROVIDER. No external gateway used.'),
        ('AC-09 / TEST-09', 'Provider service cases and HTTP-08 authenticated confirmOrder.', 'Passed one accepted confirmation and stored appointment after duplicate attempt. Browser retrieved confirmed result.'),
        ('AC-10 / TEST-10', 'provider-orders.integration.test.ts: blocked Bangkok date rejects and rolls back.', 'Passed stored status, schedule, timestamp, event and notification assertions.'),
        ('AC-11 / TEST-11', 'Provider service ownership cases plus HTTP-06.', 'Passed session-backed unrelated provider/customer action denial and unverified-provider service guard.'),
        ('AC-12 / TEST-12', 'provider-orders.integration.test.ts: concurrent confirmation and cancellation.', 'Passed exactly one successful transition. Not a universal concurrency proof for every database deployment.'),
    ], [3.1,7.1,7])
    para('CQ tests add real database/query coverage of existing behavior. They were prepared with AI assistance and are not credited as manual work or teammate review. All counts refer to individual automated cases; a passing count is not a percent coverage score or a declaration that every AC is accepted.')

def section_f_http(page, para, sub, table, code):
    page('Part F', 'Session backed HTTP execution evidence')
    para('check-http.mjs launches the built app on loopback with a newly created isolated SQLite database, explicit synthetic accounts and mock payment. It resolves generated action identifiers from that build manifest, sends real Server Action requests and checks database effects. It does not replace the application authentication or inject a chosen role into a mocked auth service.')
    table(['Scenario', 'Actual checks', 'Result'], [
        ('HTTP-01', 'Unauthenticated protected page requires login; unauthenticated create action fails and stores zero orders.', 'PASS'),
        ('HTTP-02', 'Incorrect challenge produces failure, no session cookie and zero stored sessions.', 'PASS'),
        ('HTTP-03', 'Valid challenge produces a cookie whose actual database session belongs to the seeded buyer; protected own-order route loads.', 'PASS'),
        ('HTTP-04', 'Actual order action deduplicates packages, stores buyer, total 1100, deposit 330, two items and one event; route retrieves synthetic address.', 'PASS'),
        ('HTTP-05', 'Unsupported area, foreign package, past/empty dates and all-blocked preferences reject without a new order.', 'PASS'),
        ('HTTP-06', 'Unrelated buyer and provider sessions receive no private address/note and cannot confirm the order.', 'PASS'),
        ('HTTP-07', 'Mock deposit called twice creates one paid record and advances to AWAITING_PROVIDER.', 'PASS'),
        ('HTTP-08', 'Blocked confirmation preserves events, notifications and schedule; removing the block allows one confirmation and rejects a duplicate.', 'PASS'),
        ('HTTP-09', 'Actual logout removes the session; replaying its old cookie yields an explicit login navigation and no private order.', 'PASS'),
    ], [2.3,13.1,1.8])
    code('Historical 5 November run: node docs/coursework/check-http.mjs\nRESULT 9 passed, 0 failed, 0 skipped\nCurrent 7 November run: 13 passed; see closing update')
    para('Initial harness attempts failed because the SQLite file needed to exist and because streamed login navigation was incorrectly expected to always use an HTTP 3xx status. Both failures are retained. The corrected check requires an explicit Next.js login redirect directive and no private marker; it does not treat an arbitrary HTTP 200 as authorization denial. No OTP, session token or raw server log is included in report evidence.')

def section_f_build(page, para, sub, table, code):
    page('Part F', 'Build regression and prospective correction')
    para('A local build problem was investigated rather than hidden. Default Windows Turbopack attempts failed during font fetching or worker startup. Calling the documented Webpack option directly compiled successfully, but actual browser inspection exposed unprocessed Tailwind styles and oversized brand graphics. Compilation alone was therefore not accepted as product correctness.')
    sub('Recorded contract and red result')
    para('BUILD-CONTRACT.md and check-css.mjs were committed as 7b8ee93 before the corrective configuration change. BLD-AC-01 requires compiled Tailwind directives and the shared flex-layout utility. The actual failing assertion was retained in css-before-2026-11-05.txt. This is a new narrow red/green sequence, not reconstructed TDD for older features.')
    code('Before correction\nAssertionError: Tailwind directives must be compiled for browser layout\nactual: true    expected: false    exit: 1')
    sub('Correction and checks')
    para('The first custom-loader attempt disabled Next.js built-in CSS handling and failed; that output is retained. Contract revision 2 follows the installed Next.js CSS guide: add the official Tailwind PostCSS adapter at 4.3.3 and use postcss.config.mjs for both bundlers. Correction commit 846b532 preserves domain rules, schema and payment policy. Both default Turbopack and direct Webpack builds passed. Compiled CSS checks, bounded browser layout and nine repeated HTTP scenarios also passed.')
    code('node node_modules/next/dist/bin/next build\nnode node_modules/next/dist/bin/next build --webpack\nnode docs/coursework/check-css.mjs\nPASS BLD-AC-01: compiled directives and shared flex layout utility\nnode docs/coursework/check-http.mjs\nRESULT 9 passed, 0 failed, 0 skipped')
    sub('Review and release limitations')
    para('This correction has a specification, an actual failing check and passing verification. It still needs genuine teammate review for the course process. A direct local commit is not a teammate-reviewed PR. Successful local builds do not establish a new home-server deployment, live payment readiness or a course-approved release; none is claimed.')

def section_f_team(page, para, sub, table, code):
    page('Part F', 'Team responsibilities and contribution recording')
    para('The project owner selected the following allocation. It reflects the expected work rather than an equal-code split. Actual contribution entries must describe work performed; responsibility assignment alone earns no completion credit.')
    table(['Member', 'Primary responsibilities', 'Evidence to record'], [
        ('Suwiwat Sinsomboon\n67070503444', 'Application implementation, integration, technical corrections, build and test investigation; support the explanation of source and architecture.', 'Real commits or pair-work records, implementation notes, executed commands, defect fixes and responses to review findings.'),
        ('Supanut Sopha\n67070503441', 'Review requirements and traceability, design and execute tests, report reproducible defects, review changes and help verify the final report.', 'Authored test scenarios, dated actual results, bug reports, substantive PR findings, retest notes and verified document edits.'),
        ('Both students', 'Agree scope and acceptance, understand the design and tests, inspect the integrated journey and approve the course release.', 'Recorded decisions, reviewed integration, release reference and a truthful contribution table.'),
    ], [4.1,7,6.1])
    sub('Meaningful verification without heavy coding')
    para('Supanut can take an independent verification task from setup to outcome: read the expected rule, prepare synthetic conditions, run the journey, compare actual state with the contract, report a mismatch, and verify a correction. A finding should identify the action, starting state, expected result, actual result and evidence. Merely clicking Approve or adding a name to the cover is not this work.')
    sub('Contribution records and outstanding evidence')
    table(['Date and member', 'Artifact and work performed', 'Evidence and result'], [
        ('7 Nov / Supanut', 'Requirements review reported in Issue 4; UI and automated checks reported in Issues 5 and 8.', 'PR 14 supplies findings, logs and nine screenshots from the AI-assisted run on 8492949.'),
        ('7 Nov / Suwiwat with AI', 'Published baseline through PR 10; reproduced and corrected impossible calendar dates through PR 11.', 'Real red/green HTTP evidence, 69 integration checks and owner-authorized integration; no peer PR approval claimed.'),
        ('Awaiting execution', 'Peer review: inspect source, assertions and behavior in another author’s PR.', 'Record a specific finding or reason for approval and response or retest.'),
    ], [3.3,7,6.9])
    sub('AI declaration and attribution')
    para('AI assisted the existing application, generated this report and added regression-test code under the owner’s direction. Neither student is credited with independent manual execution, test design or review solely because AI prepared a checklist. The final submission must distinguish human decisions and checks from AI assistance. Both students must be able to explain the evidence they submit.')

def section_f_review(page, para, sub, table, code):
    page('Part F', 'Independent verification and release checklist')
    para('This handoff defines the verification details to retain. Supanut has now posted summaries on Issues 4, 5 and 8; the closing evidence update records the evidence received in PR 14 and the remaining acceptance checks. Use synthetic local data and record exact source identity. Do not test against real customers or submit a live payment.')
    table(['Check', 'Steps and expected observation', 'Record'], [
        ('RV-01 Requirements', 'Read FR-03, BR-01 and AC-05. Explain who computes the price and why the client cannot supply it. Compare wording with the source.', 'Any mismatch, clarified requirement and traceability update.'),
        ('RV-02 Normal journey', 'Log in as seeded buyer, create an order, perform mock deposit, switch to its shop, confirm an open future date and reload as buyer.', 'Role and release, order reference, totals, saved status, screenshots and actual outcome.'),
        ('RV-03 Business rejection', 'Choose a shop-blocked Bangkok date for confirmation. Confirm no new appointment, event or notification is stored.', 'Expected rejection, actual message and before/after persisted state.'),
        ('RV-04 Ownership', 'Use another seeded buyer and another provider to request the same order. Do not infer denial just because the button is hidden.', 'Request/route outcome and no private data; compare CQ-04 assertions.'),
        ('RV-05 Logout', 'Log out, reload the protected URL and attempt to return through browser history.', 'No authorized private retrieval; login requirement and session invalidation evidence.'),
        ('RV-06 Automated review', 'Run the integration suite, inspect CQ-03 and CQ-04 plus provider confirmation assertions, and read every failure.', 'Command, source identity, exit code, counts and explanation of what is not covered.'),
        ('RV-07 Integration', 'Review the real Issue and PR diff, leave a specific finding, verify response and inspect staging acceptance.', 'Author, reviewer, substantive comment, resolution and actual integration reference.'),
    ], [2.9,9.3,5])
    sub('Release acceptance gate')
    para('Accept only after the reuse decision is settled, the selected AC have execution evidence, known failures are disclosed, the actual review process is recorded and setup reproduces the release. Pin a tag or commit; subsequent development must not silently replace the assessed version. PDF navigation must be checked after final edits.')
    sub('Prepared assets and remaining human work')
    para('The report, automated query tests and teammate verification workbook are prepared. Independent student execution, genuine GitHub reviews, course approval and final release acceptance cannot be replaced by document generation. Preserve those as visible open items until the students complete them.')
