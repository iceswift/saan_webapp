# Lab 7 proposed maintenance contract

Draft v0.1, 27 November 2026 ICT. EN-021_P4, Shrine seller. Supanut Sopha (67070503441) and Suwiwat Sinsomboon (67070503444). Theme 4, E-Commerce or Ordering System.

## Approval request for the instructor or TA

> For CPE334 Lab 7, may EN-021_P4 change the existing Sprint 1 installation booking rule (F-03 / BR-02 / AC-06) from allowing dates starting tomorrow to requiring every preferred date to be at least two Bangkok calendar days after submission? This gives the shop one full intervening calendar date to prepare. The proposal applies to new direct installation orders. The Thai checkout and server will enforce the same boundary. Existing booked dates, shop availability, ownership, authoritative pricing and simulated payment rules retain their current contract. Please confirm the approved wording and any conditions.

Approval, approver and decision time: pending. Substantive teammate review: pending. Formal Sprint 1 acceptance: pending. Quevo independently reported five PASS results for the declared UAT baseline.

## Version and source register

| Role | Reference | Verification status |
| --- | --- | --- |
| Deliverable 1 inspected source | 8984429fdfdf86562fcd2b55f7317f4daf3711fa | Server rejects today and earlier. |
| Declared Lab 6 UAT baseline | f1aa54253b4711daaa03ba78d580e2ed99348e34 / saan-uat-00001-5nm | UAT report records the pairing. Formal acceptance pending. Keep the controlled exercise separate. |
| Current remote main and staging, checked 27 Nov | f1aa54253b4711daaa03ba78d580e2ed99348e34 and ec89568401c0b75157675726a45da4dd9b3bad0b | Working references. Confirm the actual implementation base and review intervening changes before red. |
| Last recorded main promotion | f1aa542 / saan-00011-bey, [run 43244290202](https://github.com/iceswift/saan_webapp/actions/runs/43244290202) | Recorded 12 Nov. Reconfirm current traffic before release work. |
| Contract review, red, green, staging, main, GCP | Pending | Record immutable SHAs, dates, run IDs and deployed revision as established. |

Source contract: [Sprint 1 preferred-date contract](../../coursework/ORDER-DATE-CONTRACT.md). Change and delivery Issues: [#39](https://github.com/iceswift/saan_webapp/issues/39), [#40](https://github.com/iceswift/saan_webapp/issues/40), [#41](https://github.com/iceswift/saan_webapp/issues/41), [#42](https://github.com/iceswift/saan_webapp/issues/42).

## SRS and feature SDS revisions for review

**Old BR-02 excerpt.** One to three real dates in yyyy-mm-dd, each strictly after today's calendar date in Asia/Bangkok. The other eligibility rules apply.

**Proposed BR-02 revision.** Let D be the Bangkok calendar date when the server validates a new direct installation order. Each submitted date must be a real Gregorian calendar date in yyyy-mm-dd and be on or after D+2 calendar days. A request containing any earlier date fails as a unit, before order creation or related writes. A valid date still qualifies subject to the existing eligibility rules. A browser opened before midnight may show a previously selectable date. The server uses the current Bangkok date and returns a Thai error that tells the customer to select a later date.

**Feature behavior.** Checkout exposes the earliest eligible date through its existing Thai date controls, including the optional backup date. Preserve Gregorian request and persisted date formats. Keep checkout and server calendar calculations aligned. Continue existing authenticated order submission and provider confirmation workflows. A valid order retains server-derived pricing and begins in AWAITING_DEPOSIT. A vendor's existing availability rules still apply.

| SRS / SDS impact | Code boundary at the checked main SHA | Coverage |
| --- | --- | --- |
| F-03 / BR-02, checkout date choices and recovery | src/app/new/checkout/page.tsx computes minDate. src/app/new/checkout/checkout-form.tsx collects preferred and backup dates. Confirm both inputs use the supplied minimum. | L7-AC-02, 03, 05 |
| F-03 / BR-02, authoritative validation | src/server/actions/orders.ts createInstallOrder checks session, date format, date floor and availability before create. | L7-AC-01 through 04, 06 |
| System SDS, storage and callers | Order preferredDates already stores Gregorian dates. Review references during implementation. Orders created before release retain their stored dates, so no data migration or API shape change is expected. | L7-AC-06 |
| System SDS, preserved boundaries | Keep session, order ownership, shop eligibility, authoritative price, and simulated deposit/confirmation behavior. Provider confirmation consumes existing saved preferences. Quote conversion and provider calendars retain their own contracts. | L7-AC-04, 06 |

## STS and acceptance criteria

Use synthetic users, a verified provider, active product, supported area, and an isolated database with simulated payments. Control time deterministically for automated boundaries. Record the actual test file and invocation when added.

| ID and level | Input and expected result |
| --- | --- |
| L7-AC-01 / L7-T01, server integration and primary red | At 27 Nov 2026 15:00 ICT submit 28 Nov as an authenticated customer, with other fields valid. Expect lead-time rejection and no order, item or event created. Old code should accept the fixture, making this assertion fail. Verify the failure reason in the red log. |
| L7-AC-02 / L7-T02, server integration | Under the same clock, submit 29 Nov. Expect success, correct stored date and initial AWAITING_DEPOSIT; verify item pricing comes from stored catalog. |
| L7-AC-03 / L7-T03, server integration | Submit 28 and 29 Nov together. Expect rejection without partial writes. Verify a valid primary and backup both persist when eligible. |
| L7-AC-04 / L7-T04, calendar and server integration | At 27 Nov 23:59:59 ICT, 29 Nov qualifies; at 28 Nov 00:00 ICT, it fails and 30 Nov qualifies. Also check 31 Dec 2026 → 2 Jan 2027 and 27 Feb 2028 → 29 Feb 2028. Reject malformed and impossible dates as before. Retain existing blocked-date behavior. |
| L7-AC-05 / L7-T05, browser | Check both date fields show the same Thai minimum. With a stale form, verify server rejection still explains recovery. Select a valid date, submit with test account and open the saved order again. |
| L7-AC-06 / L7-T06, regression | Check signed-out submission, unrelated-user order access, an existing order with a previously valid date, and the original mock deposit to provider-confirmation path. Attribute each result to the actual suite or manual journey. |

After approval and contract review, commit the test separately against the verified base. Run the exact same test red and green. Record command, SHA, ICT timestamp, fixture, expected and actual outcomes and pass/fail/skip. Use the existing test:unit and test:integration scripts. Use test:postgres for the existing database constraints and test:payments:postgres if applicable. These scripts do not establish new lead-time behavior by themselves. Archive the selected post-deploy checks and the original order journey against the confirmed Cloud Run revision.

## Report evidence slots

- A01 approval and accepted baseline. A02 old/new contract and impact matrix. A03 substantive teammate review.
- B01 deterministic red. B02 same test green and code diff. B03 regression. B04 staging and main review, CI and release. B05 GCP revision, changed behavior, and preserved journey.
- C01 completed Issues and disposition. C02 merged PRs by target. C03 CI outcomes by workflow and branch. C04 named suite results on candidate SHA. C05 UAT defect status at a dated snapshot, with independent PASS results shown separately. Freeze repository counts at the submission snapshot; keep item IDs and selection rules. Write one action in 100 words or fewer.
- D01 readiness checklist with owner/actions. D02 technical debt and known defects. D03 retrospective, contributions and AI use. Candidate has no Lab 7 readiness claim while approval, test and release evidence remain pending.
