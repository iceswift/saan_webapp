# Omise sandbox payouts

Implementation date: 18 October 2026. This is a test-only order-payout integration to fictitious bank recipients, not live settlement approval.

## Critical observed contract

Actual standalone probes against this account/API version returned a NEW transfer when repeating the same idemp_key and identical request. The same key with a different amount also created a new transfer. Therefore Saan does not use that parameter as a duplicate-prevention guarantee. No automated POST retry is permitted.

Original paid probe: trsf_test_69dupqk6smkr1idpp43 (THB 100). Duplicate probe: trsf_test_69durfim1wwnpiqxyw7 (THB 100, pending). Different-amount probe: trsf_test_69durh7l53y0xs7qt5l (THB 101, pending). Independent GET list returned all three identities with matching probe metadata. These two additional transfers are deliberate synthetic failure-contract evidence, not application duplicates; they have not been marked paid and are not Saan order payouts. Preserve their records.

## Configuration

`OMISE_PAYOUT_TEST_ENABLED=true`, `OMISE_PAYOUT_TEST_RECIPIENT=recp_test_...`, `OMISE_PAYOUT_TEST_PROVIDER_ID=...`. All three are required, along with the private staging synthetic-login gate (or a non-production development/test runtime). Production always rejects these actions. Defaults are off. Recipient must be active, verified, test-mode and bank code test; real bank destinations are rejected even with test credentials.

Admin initiation requires explicit acceptance of `SANDBOX_SHOP_ABSORBS_COSTS_V1`: zero commission for this rehearsal only, collection costs deducted before the requested transfer, transfer costs deducted from the requested amount. This is not Saan's commercial fee policy and does not resolve tax/accounting decisions. UI distinguishes gross receipt, collection costs, requested transfer, transfer fee and bank net.

## At-most-once dispatch and recovery

- Exact verified original charge receipts, original request identities, full payment, completed order, bound shop and no refund operation are required.
- Unique MoneyOperation key per order and unique PayoutAttempt per operation prevent a second intent. PROCESSING is committed before POST and never automatically executed again, even after process death before dispatch. A crash in that gap may require manual investigation; safe at-most-once dispatch favors a stranded reservation over a double payout.
- Attempt snapshots account ID, recipient ID, a digest of the test destination, original gross, collection cost and policy. Destination or provider-account changes block reconciliation for review.
- On timeout or local persistence failure, keep UNKNOWN and its fund reservation. Recover by GET of the stored transfer or a bounded paginated list matching unique `metadata.saan_payout` to the original operation ID, then validate mode, recipient, amount, metadata and fee arithmetic. More than one match is an exception. Absence or scan-limit exhaustion never authorizes a replacement POST.
- Paid and sent are separate. Only verified paid=true AND sent=true without failure/deletion finalizes SUCCEEDED. Pending, failure/deletion and uncertainty retain allocation for manual review. No automatic failed-attempt replacement or reservation-release control is provided.
- Status and the final audit event commit together; duplicate reconciliation does not create another completion event. The scheduled reconciliation route checks bounded payout batches with GET-only operations. Worker cannot initiate transfers.

## Fund protection

An account-wide PaymentPool row serializes payout reservation and settlement finalization with refund-obligation recording. During reservation, under that lock, fetch current provider transferable balance and subtract original PAID Omise amounts for cancelled or still-cancellable AWAITING_PROVIDER orders, plus every unresolved Omise payout reservation. Require the remainder to cover the proposed transfer. Recheck order status under its write lock.

Conservative accounting may count a pending provider debit and its local reservation twice; it may block a payout early, but does not spend uncertain funds again. No cross-account, multi-currency, live dispute, partial-refund or automatic fee-subsidy support is claimed. External/manual dashboard withdrawals can change provider balance outside Saan's lock; provider insufficient-balance responses remain uncertain, never trigger a repeat POST. Direct manual transfers should be operationally restricted before live launch.

## Deployment and rollback

Additive migration `20261018040000_payout_attempts` creates PaymentPool and PayoutAttempt. Back up on home server before migration and retain historical data. Apply migration before enabling the payout flag/new worker route. Backups stay on the home server under the owner's current preference.

Rollback: disable new payout initiation, retain the attempt/pool tables and original operation references. An older image cannot reconcile these attempts through its collection-only gateway; use the reviewed current reconciliation path to resolve outstanding transfers before downgrading. Never reroute an Omise payout through mock or delete its journal to try again.

## Verification

New integration tests cover authorization/gates, immutable policy, incomplete work, same-order concurrent dispatch, cross-order fund competition, refund/unknown reservations, lost POST response, missing/ambiguous recovery, account/destination mismatch, sent versus paid, concurrent finalization and PostgreSQL/SQLite fault injection after provider acceptance. Client fixtures cover live-ID rejection, no network retries, redacted errors and response/fee matching. Real provider and deployed browser evidence are recorded in staging QA after rollout.

Remaining live gates: approved marketplace/holding arrangement, real destination onboarding, commercial commission/fee/tax policy, production authentication/admin controls, disputes/refund-after-payout handling, monitoring and authorized live activation. This sandbox milestone does not open live transfers.

## Restore and pause rule

`PAYMENT_MUTATIONS_DISABLED=true` blocks new payout initiation and the final pre-POST check; GET reconciliation remains available. Before restoring any database, pause outbound mutations. A restore can remove knowledge of a transfer that already exists at Omise, and the observed idemp_key behavior does not protect a replay. Audit provider transfers across the restore interval and map the original attempts before resuming; missing metadata/journals require investigation, never matching by amount alone or blindly creating a new operation. This sandbox does not claim autonomous recovery from lost pre-intent database history.

## Reconciliation fairness follow-up — 19 October 2026

Unresolved checks now rotate their scheduling timestamp after each worker attempt, including missing-transfer and verification-error results. A compare-and-update guard preserves concurrent result writes. The batch remains bounded to three and GET-only; UNKNOWN allocations remain reserved and no replacement transfer is created. A regression places three missing transfers before a paid fourth transfer and verifies that the next batch finalizes the fourth without resending any of them. Verified in 59 SQLite integration tests and 46 isolated PostgreSQL tests (current deployed image with these two candidate source/test files mounted read-only). This follow-up is source-tested, not yet included in the deployed image.
