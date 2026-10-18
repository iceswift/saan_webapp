# Refund case sandbox workflow

Implemented 18 October 2026. This is an operational rehearsal, not a bank-transfer integration or a record of actual reimbursement.

## Boundaries

`REFUND_CASE_TEST_MODE=true` explicitly enables admin actions only in development/test or private staging with its synthetic-phone allowlist enabled. Production always rejects these actions. Default is false, including Compose. Only cancelled orders with an ACTION_REQUIRED Omise-test refund obligation and its PAID `chrg_test_` receipt qualify.

One RefundCase per MoneyOperation, fixed to its entire original amount in satang. Partial refunds and real bank destinations are intentionally unsupported in this first rehearsal. Do not bypass the amount check to add them. The original Payment stays PAID, obligation stays ACTION_REQUIRED and finance outstanding/refunded totals do not change, even when the test case completes. This protects against interpreting a simulated admin action as bank evidence.

## Workflow

1. In admin finance, open a full-amount test case on an eligible obligation.
2. Enter a synthetic `TEST-DEST-...` destination. Verify it, then approve the case.
3. Record `TEST-TRANSFER-...` and `TEST-EVIDENCE-...` to simulate submission. This remains SENT_UNVERIFIED.
4. Supply `TEST-VERIFY-...` to complete the rehearsal: TEST_COMPLETED, explicitly no actual refund.

Suffixes use 3–60 uppercase ASCII letters, digits or hyphens. No account numbers, names, uploads or real receipt files are accepted by this workflow. These are validated training identifiers, not independently verified banking evidence. A single admin may rehearse all steps; this is not a production dual-approval system.

Destination changes before submission reset review to DETAILS_RECEIVED and invalidate prior approvals. Post-submission destination changes are rejected. Every accepted transition conditionally claims the current case version and inserts an audit event in the same transaction. Duplicate transfer references are rejected across cases. There is no mutation/deletion endpoint for the event history; events include actor, timestamp, transition and synthetic note.

The customer sees only amount, case status and the explicit test disclaimer on their own cancelled order. Internal destination, evidence identifiers and actor history are excluded. Shop finance does not receive internal case details. All admin mutations check the authenticated user's current database role on the server.

## Storage and rollout

Additive PostgreSQL migration: `20261018030000_refund_cases`, two tables, unique case entitlement and transfer reference, restrictive relations and positive amount constraint. Canonical SQLite/generated PostgreSQL schemas remain synchronized. Never reset staging or copy backups off the home server under the current owner preference.

Take a server-local backup first. Apply migration before starting the new app/worker. Enable the flag only on private staging. On rollback disable the flag and use the prior image while preserving both case tables and all money records. No provider credential or public webhook change is needed.

## Verification

Run `npm run test:integration` on the runner's isolated SQLite database. PostgreSQL runner `scripts/run-payment-postgres-tests.mjs` includes the refund-case suite and refuses any path other than `/saan_test`. Tests cover admin authorization, explicit gate, duplicate open, over/under/fractional amounts, destination invalidation, stale versions, conflicting completion, reference reuse, audit insert failure rollback and customer/shop privacy. Browser and deployment evidence is recorded in the staging QA document after verification.

## Remaining live work

Real destination collection/encryption, file evidence access, independent bank verification, reviewer policy, partial-amount ledger, refund/payout allocation, tax/accounting policy and approved execution rails are separate work. TEST_COMPLETED must never be mapped to financial SUCCEEDED or treated as an Omise Refund. Existing external-refund design remains the target for those future capabilities.
