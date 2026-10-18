# Omise contract spike: tooling and evidence

Updated 18 October 2026. **Test-account authentication, advertised PromptPay capability, sandbox QR creation and successful payment retrieval verified.** The owner configured a test key in the Git-ignored `.env.omise-test`. Read-only requests using API version `2019-05-29` returned HTTP 200: `/account` returned `object=account`, `livemode=false`; `/capability` returned `object=capability` and included `promptpay`. Provider idempotency contract tests remain pending. Historical spike evidence below is supplemented by the staging QA: private staging now runs `saan:refund-a7c7fa12ae14` with a rotated test key, verified deposit/balance collection, polling and cancellation obligations. Refund/payout execution remains disabled. See the sandbox runbook and OMISE-REFUND-SETTLEMENT-DESIGN.md for current gates.

### Subsequent actual sandbox probes

- Created `saan-contract-20261018-001`, THB 20 (2000 satang), charge `chrg_test_69dqjdzfujl2hc6p0gy`. Initial provider response and independent GET both returned pending/unpaid. A later GET returned expired/unpaid; the original expiry was `2026-10-18T05:54:48Z`.
- Created replacement `saan-contract-20261018-002` only after confirming the first expired. Charge `chrg_test_69drbxrn2gi8rn0cubt` returned pending/unpaid, QR present, requested `ref_id` echoed and expiry `2026-10-18T07:15:54Z`.
- The owner selected Testing → Mark as paid for the second charge in the dashboard. Independent API retrieval at `2026-10-18T07:07:10Z` confirmed the same charge/reference, THB 20, `status=successful`, `paid=true`, test mode. This confirms sandbox completion, not a live bank payment. The simulation is documented in the [PromptPay guide](https://docs.omise.co/promptpay).
- These are standalone sandbox records, not Saan order payments. No refund or shop transfer has been performed. Provider duplicate-create semantics remain unproven.
- Added raw-byte HMAC verification, rotated secrets, replay checks, durable inbox and worker. Fourteen local provider/signature/endpoint tests pass. Public callback delivery is still untested; see [sandbox runbook](OMISE-SANDBOX-RUNBOOK.md).

## Implemented

- `src/server/omise-test-client.ts`: server-only, fixed `https://api.omise.co` origin, explicit API version, test-secret-only authentication and test-charge-only responses.
- Create a PromptPay source and charge in one request; retrieve the same charge with GET. Reject wrong amount, currency, method, identity, live mode and inconsistent paid/status evidence.
- Request timeout, rejected redirects and sanitized errors. No automatic POST retry. Ambiguous HTTP/network results remain UNKNOWN.
- `scripts/omise-contract-spike.ts`: explicit create opt-in and an exclusive local reference reservation before dispatch. Evidence is kept in ignored `storage/omise-contract-spike/`. Duplicate create refuses even after a process restart.
- The evidence file contains reference, amount, charge identity and observed status only. It is not Saan's payment ledger, a webhook inbox or production idempotency storage.

## Running against a test account

Set `OMISE_TEST_SECRET_KEY` and `OMISE_API_VERSION` through a protected process environment. The command does not automatically load `.env`; Next.js loading behavior does not apply to this standalone script. Never paste keys into chat, command history, tracked files or screenshots. The placeholder API version in `.env.example` must be checked against the account before use.

Creation additionally requires `OMISE_CONTRACT_SPIKE_CREATE=true` in that environment. Then:

```text
npm run payment:omise:spike -- create saan-contract-unique-001 2000
npm run payment:omise:spike -- retrieve saan-contract-unique-001 2000
```

The amount is satang: 2000 means THB 20. The tool accepts only test keys and test charge objects. It does not simulate payment completion or make any shop transfer/refund. It prints no QR payload; this first tool verifies the API boundary, not the full customer QR journey.

Use a unique reference for a genuinely new test. **Do not replace a reference just because a previous request timed out.** If the reservation has no confirmed charge ID, investigate that reference through Omise before any further creation. Keep the reservation; deleting it bypasses the local protection. Local reservations do not prove that the provider honors `ref_id` and do not replace database constraints for the application.

If the process is interrupted after Omise accepts a request but before local evidence is saved, the record can remain RESERVED. Treat this as uncertain and recover from provider evidence. Do not reset it to an unsubmitted state. If recovering an actual charge ID requires a manual procedure, document the observed ID/reference match before adding a dedicated recovery tool.

## Evidence status

| Check | Status |
|---|---|
| Reject live/missing keys and production APP_ENV | Automated local fixture test |
| Create request shape and pending semantics | Automated local fixture test |
| Wrong amount/currency/identity/mode and inconsistent paid flag | Automated local fixture test |
| Timeout/429/409/server failures; no retry and no secret leakage | Automated local fixture test |
| Retrieve only the original charge | Automated local fixture test |
| Amount and expiration validation before dispatch | Automated local fixture test |
| Missing configuration command | Verified to fail closed without a provider request |
| Test-key authentication and advertised PromptPay capability | VERIFIED — read-only account/capability API calls, HTTP 200, test account |
| Actual charge creation, QR generation, echoed reference and expiry | VERIFIED — two sandbox attempts, first independently confirmed expired |
| Actual successful completion | VERIFIED — dashboard Mark as paid followed by independent same-charge GET |
| Actual `ref_id` duplicate, mismatch, lookup and recovery behavior | NOT RUN — release gate remains open |
| Signed public webhook and rotation | Code and fixture tests implemented; actual public delivery NOT RUN |
| Method-specific refund process and shop transfers | NOT IMPLEMENTED / NOT RUN |

Automated client fixtures run with `npm run test:payment-provider`. They make no network requests, do not connect to a database and do not establish provider account support.

## Next implementation

1. Run and document actual account probes, including the provider-supported completion mechanism and idempotency behavior. No fake success or public test-completion endpoint.
2. Implement durable application attempts and immutable provider account/mode mapping with PostgreSQL concurrency tests. Migrate additively, preserving mock history.
3. Connect the tested client through the new attempt service, then add customer QR UI, public signed webhook inbox and reconciliation worker.
4. Keep live collection gated by the unresolved refund, marketplace and installment questions in [OMISE-PAYMENT-PLAN.md](OMISE-PAYMENT-PLAN.md).

References: [PromptPay](https://docs.omise.co/promptpay), [Charge API](https://docs.omise.co/charges-api), [API testing](https://docs.omise.co/api-testing). Implementation decisions above are Saan's conservative handling of uncertain financial requests; confirm provider behavior with actual account evidence.
