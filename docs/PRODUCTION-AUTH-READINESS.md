# Production authentication readiness

Prepared 4 November 2026 from the current implementation. This is an engineering plan, not an enabled SMS integration. Production remains closed to test login.

## Current behavior

`runtime-policy.ts` allows designated private-staging phones only. Both request and verification actions enforce this gate; authenticated reads also reject test identities outside the allowed environment. `integrations.ts` exposes `SmsSender.sendOtp` but currently supplies only the console/test adapter. The test action returns the visible code; OTP records contain the test code, expire after five minutes, limit verification attempts to five and requests to five per phone in ten minutes. Consumption is conditional, so concurrent reuse is rejected. This is insufficient for public SMS authentication and must not simply be enabled for all phones.

## Information needed from the owner

- Actual SMS/OTP account/provider, approved sender/template and recipient-country scope. Credentials go directly into protected server configuration, never chat or Git.
- Public domain/origin and approved support contact for failed access/recovery. Neither is configured today.
- Operator who handles delivery failures/account recovery and receives alerts. Do not invent a phone, email or LINE account.

Provider pricing, sender approval and contractual terms must be checked against that provider's current official documentation once selected. No account purchase, message sending, public access or agreement acceptance is authorized by this plan.

## Implementation sequence

1. Define a delivery result/reference in the sender adapter; make timeout/failure explicit. Keep test and real adapters separate and fail closed for missing configuration. A successful API submission is not proof of handset delivery.
2. Store a secret-keyed OTP digest or use the provider's verification contract; do not retain plaintext real OTPs or log phone/code pairs. Isolate any legacy test-code compatibility behind the existing private test gate. Provide secret rotation and OTP/session retention procedures.
3. Supersede previous challenges for the same identity when issuing a new one. Test that an older code cannot become usable after the newest code is consumed. Handle concurrent resend/verification and delivery failure without ambiguous active challenges.
4. Add abuse controls beyond the existing per-phone counter: trusted client-network handling, account/network/global send budgets, resend pacing and bounded retries. Never trust arbitrary forwarded headers or permit unbounded spend across many phone numbers. Provide clear Thai retry guidance and accessible status announcements.
5. Keep production responses free of test codes. Validate canonical Thai phone identity consistently across sending, verification, session creation and recovery. Use generic failure responses where needed to avoid exposing account membership.
6. Test delivery through the selected provider's sandbox/test facilities, then a small owner-approved real-recipient trial. Confirm actual origin/cookies, mobile autofill, keyboard, large text, resend, failure recovery and operator alerts. Only then consider public-login activation.

## Required acceptance evidence

- Production rejects test/sandbox identities and cannot return or log a code.
- Missing/wrong credentials, provider rejection, timeout and duplicate request do not create a usable unsent challenge or an unintended send loop.
- Expired/wrong/locked/consumed/superseded challenges fail; concurrent redemption creates one session outcome.
- Phone variants resolve to the same identity; cross-account access remains forbidden.
- Abuse budgets work under concurrency and the operator can pause sending without losing existing order records.
- A real-user recovery path and support recipient exist before launch. Existing private-staging mock tests remain separate from delivery certification.

Record adapter, account mode, test destinations, release and redacted evidence in DEPLOYMENT-STATUS.md. Do not label this checklist as completed until those tests occur.
