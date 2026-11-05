# Saan independent verification workbook

## Purpose and assignment

Supanut Sopha (67070503441) owns independent requirements review, test design, manual execution, reproducible defect reporting and substantive peer review. Suwiwat Sinsomboon (67070503444) leads application development, integration and technical corrections. Both must understand the assessed behavior. This workbook is prepared material, not evidence that either student performed its checks.

Use this workbook with report Parts A, E and F. The target is a complete small domain journey, not a survey of every Saan screen. Never use real customer data, bank details, live payment keys or real payments.

## Record before starting

- Tester and actual execution date/time:
- Git commit and any uncommitted diff:
- Environment: local isolated demo / other approved synthetic environment:
- Browser, operating system, viewport and text-size setting:
- Seed procedure and synthetic account roles:
- Payment mode confirmed mock or provider test, with no real-money action:
- Screenshot directory and evidence naming convention:

The local README documents synthetic customer 0800000002 and verified provider 0800000003. Another synthetic customer and a second provider must be created through the approved local seed/fixture procedure when testing unrelated users. Do not repurpose real accounts. Local development shows a test OTP; do not include OTPs or session token values in screenshots.

## Requirements review before execution

Explain these points in your own words and record any ambiguity as a finding:

1. The buyer's identity comes from the server session. A provider may also buy for itself; owning a provider does not authorize another shop's orders.
2. The server obtains prices from active products and packages of the same verified shop. An order preserves price snapshots after catalog edits.
3. Preferred dates must be after today in Bangkok and include an available day. A confirmed appointment must also be a future time on an open Bangkok date.
4. A deposit must succeed in the test environment before the provider can confirm. A QR being displayed is not proof of payment.
5. A failure must not silently create an extra order, appointment event or notification. Explain what each assertion actually checks.
6. A passed database/query test does not automatically prove the session-backed HTTP route or the complete UI journey.

## MV 01 Valid login and current user

Links: AC-01 / TEST-01. Start logged out with a seeded synthetic customer.

1. Open the login page and submit the synthetic phone.
2. Enter the displayed test challenge without capturing it in the report.
3. Open the account and own orders pages; reload.
4. Confirm the account name/role and visible records belong to the intended seed user.

Expected: a server-established session survives reload, and the user does not select their role from an arbitrary UI control. Record actual result, screenshot references and any backend/session evidence. This record is still blank until executed.

## MV 02 Invalid and replaced login challenge

Links: AC-02 / TEST-02. Request a synthetic challenge.

1. Enter an incorrect code. Confirm a useful error and no authorized protected view.
2. Request a replacement. Confirm the old code is rejected and the newest accepted.
3. Inspect the automated expiry, replay and lockout assertions rather than claiming manual time travel.

Expected: failure does not establish a session. Record which cases were manual and which were automated; do not combine them into an invented E2E result.

## MV 03 Catalog eligibility and filter behavior

Links: AC-04 / TEST-04; CQ-01 and CQ-02.

1. Use synthetic active, inactive and unverified-shop items.
2. Search by their unique fixture prefix. Only the active verified item should be returned.
3. Apply the known shop area and exact price ceiling, then a lower ceiling and an unsupported area.
4. Open detail and verify only active same-shop packages are shown.

Expected: ineligible items stay unavailable. CQ tests already exercise the query; capture the UI separately. Do not modify real shop verification status for this check.

## MV 04 Order submission and persisted retrieval

Links: AC-05 / TEST-05. Start with an eligible seeded product and a signed-in buyer.

1. Record the product and package values as displayed.
2. Fill synthetic site address, supported area and one to three available future dates.
3. Submit once and record the returned order reference.
4. Verify AWAITING_DEPOSIT, price snapshots, server-calculated total and rounded 30 percent deposit.
5. Reload, leave the page and reopen it from own orders. Compare the saved result.

Expected: one complete order with its initial event. CQ-03 proves retrieval snapshots from a database fixture, not the action-creation step. Obtain actual action evidence here.

## MV 05 Invalid order boundaries

Links: AC-06 / TEST-06. Each row needs an independent fixture or starting-state record.

| Boundary | Expected | Actual result and evidence |
| --- | --- | --- |
| Missing required site data | Inline error, focus recovery, no new order | Not executed |
| Today or a past preferred date | Rejected, no new order | Not executed |
| All preferred dates blocked | Rejected, no new order | Not executed |
| Package from a different shop | Entire request rejected, no partial order | Not executed |
| Duplicate same-shop package | Counted once in total and item snapshot | Not executed |
| Stale inactive product | Rejected despite an older detail page | Not executed |
| Unsupported service area | Rejected, no new order | Not executed |
| Impossible yyyy-mm-dd date | Intended rejection; inspect actual action behavior | Not executed; possible validation gap |

If UI controls prevent a malformed request, distinguish that from backend rejection. Use a legitimate action-level test rather than editing screenshots or claiming an unperformed request.

## MV 06 Test deposit and shop confirmation

Links: AC-08 and AC-09 / TEST-08 and TEST-09.

1. Confirm the environment is mock/test and no live money can move.
2. Complete the order's test deposit. Confirm one paid deposit and AWAITING_PROVIDER.
3. Log out and sign in as the assigned verified shop.
4. Confirm a future open appointment. Reload to verify CONFIRMED and saved time.
5. Reopen as the buyer. Record the displayed appointment and status.

Expected: one accepted transition and one corresponding event/notification. Automated duplicate-payment coverage supplements this journey; it does not mean the tester manually proved every gateway outcome.

## MV 07 Blocked day rejection and rollback

Links: AC-10 / TEST-10. Use a synthetic AWAITING_PROVIDER order and its shop's blocked Bangkok day.

Record status, scheduledAt, relevant order-event count and buyer-notification count before the attempt. Attempt confirmation. Record actual rejection and the same persisted values afterward. Expected: no change. The regression uses 2030-01-02 at 00:30 Bangkok, which is the previous UTC day; explain why comparing UTC calendar strings would be wrong.

## MV 08 Forbidden ownership operation

Links: AC-07 and AC-11 / TEST-07 and TEST-11; CQ-04.

Use the same synthetic order under an unrelated customer and then an unrelated provider. Request the detail URL and try only authorized test interfaces for confirmation. Expected: no private address, note or messages and no order mutation. Record the route/request result, not just absence of a button. Compare this with CQ-04's explicit null assertions and the provider-service negative test.

## MV 09 Logout invalidation

Links: AC-03 / TEST-03.

1. Sign in, open a protected own order and verify it is available.
2. Log out through the app.
3. Reload the protected URL and revisit it through browser history.
4. Verify a fresh request no longer retrieves private data and the session record is invalidated by the chosen design.

Record actual behavior. A previously painted page in browser memory is not itself proof that a new request is authorized; distinguish the two.

## MV 10 Review automated evidence

Run `npm run test:integration` through the existing isolated runner. Read the test source for CQ-03, CQ-04 and the blocked-day rollback case. Record command, source identity, exit code and counts. Explain why a fixture-created order does not prove createInstallOrder and why a trusted viewer parameter does not prove cookie authentication. Read failed/skipped output; do not delete or weaken tests for a clean report.

## Defect record template

- Defect ID and linked FR/BR/AC:
- Tester, date, release and environment:
- Starting fixture and role:
- Exact reproducible steps:
- Expected behavior and its source:
- Actual behavior:
- Data changes or absence of changes:
- Screenshot/test-output references without secrets:
- Severity and reason:
- Developer response and correction reference:
- Retest date, steps and actual result:

## Peer review checklist

Use the real Issue and PR. Do not approve your own work or replace the teammate with an AI-generated approval.

- Confirm the linked requirement and acceptance criterion are understandable.
- Read the diff and verify the actual authorization boundary.
- Inspect the assertion, fixture isolation and cleanup, not just the green result.
- Check rejected operations preserve intended state.
- Record at least one specific checked condition, question, finding or reason for approval.
- Verify the response to findings and retest affected behavior.
- Confirm staging integration, actual release reference and final board status.

For example, a useful review records: which test asserts no side effects after a blocked-day rejection, which database values were checked, and what remains untested. The example is guidance, not an actual review.

## Final signoff record

- Scope accepted by both students:
- Assigned-theme and existing-project decision:
- Required checks executed, failures and gaps disclosed:
- Genuine Issue and review references:
- Contributions verified by each student:
- Final release tag/commit:
- Report page references and artifact hashes:
- Actual acceptance date and participants:
