# Lab 7 contract draft v0.2

Suthep Madarasmi's course announcement of 24 November 2026 at 20:49 waives instructor/TA approval for the change request. The team selects a substantive change and records peer review of the versioned contract before implementation. Formal Sprint 1 acceptance remains pending. Quevo reported five PASS on the declared baseline f1aa542 / saan-uat-00001-5nm. Confirm the accepted baseline and actual pre-change SHA separately.

## Old and proposed SRS rule

F-03 / BR-02 / AC-06. Existing direct installation checkout permits every real preferred date from tomorrow, subject to eligibility and availability. Proposed: each verified provider may persist a lead time of 1–7 Bangkok calendar days, with default 1 for existing and new providers. Only the provider owner can edit it. A new direct installation order must have every date on or after the Bangkok server date plus the current shop lead time. Reject the whole request on an early date. Saved orders retain their dates.

| Impact | Contract and verification |
| --- | --- |
| Provider settings and data | Owner-only form/action and additive provider field with default 1. Test existing and new default, successful save and readback, malformed and out-of-range inputs and unauthorized writes. |
| Checkout and booking action | Use the persisted shop minimum for both calendar fields and current settings on server submission. Test two shops with lead times 1 and 3, D+1 and D+3, mixed dates, no writes on rejection and a checkout opened before the setting was raised. |
| Time and regression | Test Bangkok midnight and month/year rollover, retain ISO validation, availability, prices, ownership, mock deposit and provider confirmation. Verify saved order dates across migration. |

For red, run an actual booking test on the old application with controlled time and a fixture representing a three-day lead time. If additive fixture schema is needed, record it separately. Confirm that the old code accepts the too-early date and that the test fails on that behavior. Keep the assertion identical on green. Capture settings, changed booking behavior and a preserved Sprint 1 journey on the deployed revision.

See Issues #39–#42 for contract review, test/release evidence and report ownership.
