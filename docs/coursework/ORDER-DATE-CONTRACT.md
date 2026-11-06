# Preferred installation dates — prospective correction

Recorded 7 November 2026 before changing order validation. Issue #6; F-03, BR-02, AC-06.

An authenticated order submission must supply one to three real Gregorian calendar dates in exact yyyy-mm-dd form, strictly after today's calendar date in Asia/Bangkok. Reject invalid months, zero days, overflow days, non-leap 29 February and trailing text. The UI's Thai Buddhist-era display does not change the posted Gregorian contract. A rejected request must create no order, items or events. Valid leap days and tomorrow must remain accepted, subject to existing shop/package/calendar rules.

Plan: add a real HTTP action regression using future impossible dates against the current compiled application. Retain the actual failure, then strengthen server validation and rebuild. Run real HTTP regression again and the existing integration/type/lint checks. Use only fresh isolated synthetic SQLite data and mock payments. Unit checks, if added, complement rather than replace the session-backed persistence assertion.

Repeated identical order submissions are currently separate new purchase intents; no order idempotency promise is introduced in this narrow correction. Recheck current product/provider/package eligibility at each submission in the HTTP boundary pass. Payment retries retain their existing independent deduplication policy.

The owner may integrate after verification. This is not a claim of substantive teammate review; course-required cross-review remains separately attributable.
