# Coursework documentation plan

Prepared 5 November 2026. Assignment deadline: 8 November 2026 at 23:59, as stated in the supplied assignment.

## Product decision

Saan is the primary product. The teammate's shrine-store proposal is optional background, not an agreed specification. Preserve the marketplace domain and describe existing code honestly. The course master specification `group_work_specs.docx` is not supplied; assigned theme and permission to reuse the existing baseline remain unresolved.

## Source hierarchy

1. Supplied eight-page Project Deliverable 1 brief: assessment structure A through F.
2. Current Git baseline and source files: actual behavior, interfaces and tests.
3. Dated deployment and QA records: historical execution evidence, not fresh test runs.
4. Product plan: context and broader intentions, not proof of implementation.
5. Teammate draft and Gemini suggestions: unapproved proposals only.

README contains older descriptions of storage, payments and support configuration. Resolve these against source and dated operations documents; do not silently copy stale claims.

## Report design

English prose, A4 portrait, restrained black typography, readable compact tables, generous cell padding, numbered pages, explicit A-F navigation, two technical diagrams. Keep code excerpts short. Word is editable; PDF is the visual submission format. No invented interviews, measured performance, peer reviews, issue IDs, test results or student contributions.

## Scope

Proposed Sprint 1: session identity, verified catalog, persisted installation order with server pricing, test deposit and provider confirmation. Test deposit is needed because source only permits confirmation from AWAITING_PROVIDER. Demonstrate persisted retrieval, blocked Bangkok date rejection and cross-owner denial. Live payments and public SMS are excluded.

The three-sprint plan is a proposed course allocation over an existing baseline, not a claim that older commits happened in a new sequence. Existing implementation precedes this report. Genuine future changes must record contracts and failing tests first where appropriate.

## Work sequence

1. Inspect the brief, relevant source, schemas, test assertions and existing evidence.
2. Define stable FR, BR, NFR, feature, AC and test IDs, including explicit exclusions.
3. Author an English report with A-F coverage and distinguish evidence from plans.
4. Run safe isolated local checks and retain command, baseline SHA, timestamp and counts.
5. Generate DOCX, render PDF and inspect all page images; repair layout before delivery.
6. Obtain missing master specification and course reuse decision. Student identities confirmed by owner: Suwiwat Sinsomboon 67070503444; Supanut Sopha 67070503441. The teammate draft's different ID is superseded.
7. Complete genuine student participation, Issues/PR reviews, UI/API evidence and release acceptance; update the report and rerun checks on the final immutable release.

## Evidence rules

- Never fabricate a historical red test, review or contract-before-code sequence.
- A service integration test is not automatically a browser/API authorization test.
- Historical 4 November results retain their date; fresh local results get separate files.
- Private staging is not the local assessment environment or a GCP deployment.
- Keep real secrets, OTP values and private records out of report evidence.
- Do not upload, publish, submit to LEB2 or contact the teammate/instructor without an explicit request.

## Second pass and practical team allocation

The owner confirmed Suwiwat leads coding/integration and Supanut focuses on requirements review, test design/execution, defects and substantive PR review. The report and workbook now follow that allocation. Assignment is distinct from completed contribution.

Add CQ-01 to CQ-04 to the real isolated integration suite. Verify the actual built action/session boundaries with check-http.mjs, not an auth mock. Preserve failed setup and redirect-assumption attempts. App Router can send login navigation after streaming starts; require an explicit redirect directive and absence of private fields when HTTP status is already 200.

The initial direct Webpack compile exposed missing Tailwind output in actual browser screenshots. Preserve that failure and css-before output. BUILD-CONTRACT.md was committed at 7b8ee93 before correcting the configuration. The first custom CSS rule disabled native Next.js handling and failed; revision 2 follows the installed CSS guide with the official matching PostCSS adapter. Require build, generated CSS, actual browser layout and HTTP rechecks before accepting the correction. Do not substitute compile success for UI correctness.

## Second pass completion record

The English report now has 27 verified pages with correct A-F navigation, detailed data/UI contracts, per-AC coverage, real HTTP and visual excerpts, the prospective stylesheet regression and practical team allocation. Both default and direct Webpack builds passed on application source 846b532; 69 isolated integration cases, 9 real HTTP/session scenarios, compiled-CSS checks, TypeScript and targeted lint passed. No independent student review is claimed. Final source hashes and artifact hashes are in evidence/manifest.json. Original 16-page outputs are retained in ignored output/coursework/archive/v1.

Remaining work is explicit: course master specification and reuse decision; genuine teammate execution, Issues/PR review and release acceptance; a complete selected browser-created order journey; impossible calendar date, stale submission eligibility and duplicate order-submission boundaries. Existing service idempotency tests do not automatically cover those separate cases. Local demo sessions were signed out and port 3201 was stopped. No home-server deployment or backup change was made.
