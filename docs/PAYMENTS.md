# Payments and settlements

Implemented internal flow; no real money is moved. Omise is the first provider selected for test-mode investigation. The researched implementation proposal, unresolved contract questions and delivery gates are in [OMISE-PAYMENT-PLAN.md](OMISE-PAYMENT-PLAN.md) (18 October 2026). That plan is not an implemented integration or live approval.

The server-only test client and guarded contract-spike command are implemented; actual sandbox QR creation and successful retrieval have passed. See [OMISE-CONTRACT-SPIKE.md](OMISE-CONTRACT-SPIKE.md) for evidence. The `omise_test` collection adapter and customer QR UI are deployed in private staging with a rotated key and background reconciliation. Public callbacks remain off. Deployment evidence: [QA-OMISE-STAGING-2026-10-18.md](QA-OMISE-STAGING-2026-10-18.md).

## Omise sandbox collection increment

- Explicit `PAYMENT_PROVIDER=omise_test` plus test credentials/version selects the sandbox adapter in development or allowlisted private staging. Public production remains closed. Test notices remain visible, and card choices are hidden.
- The customer action returns QR/expiry as a pending result, not payment success. `MoneyOperation.gatewayRef` stores the charge ID before returning its QR. Reopening the order and pressing its payment button retrieves that same pending charge; it does not dispatch a second charge. Checks are conditionally throttled in the database.
- Ownership is checked on retrieval. A successful authenticated provider GET feeds the existing atomic finalization, so payment/order/notification updates occur once. Only then does the UI celebrate success.
- Refunds and payouts are unsupported by this adapter. Existing mock history is retained. Switching the configured gateway does not migrate old mock operations into Omise; reconcile them with their original adapter.
- This increment uses one reserved operation per deposit/balance. Expired/failed/uncertain attempts require inspection and cannot automatically generate a replacement QR. Multi-attempt recovery and account namespaces remain future work. Inbox/worker code now exists and PostgreSQL tests pass; public webhook ingress is not configured.
- The owner rotated the exposed sandbox key; protected home-server configuration now selects `omise_test` for private sandbox testing. No live key is configured. Do not transfer secrets through chat or tracked files.

Webhook inbox, worker and migration activation/recovery steps: [OMISE-SANDBOX-RUNBOOK.md](OMISE-SANDBOX-RUNBOOK.md). Tests passed on isolated SQLite and home-server `saan_test` PostgreSQL. Deployed browser deposit and worker/restart checks passed; public callback delivery and the complete shop/balance journey remain pending.

## Current behavior

- Development defaults to `mock`. `PAYMENT_PROVIDER=mock` is documented in `.env.example`.
- Production uses the unavailable adapter until a reviewed real adapter is added. Explicit private staging can enable simulated payments only with the switches and synthetic phone allowlist in `STAGING-TESTING.md`; `PAYMENT_PROVIDER=mock` alone cannot enable it in a production build.
- Customer: deposit -> shop acceptance -> work done -> balance and acceptance.
- Admin: `/admin/finance` shows up to 100 recent orders, refund/payout history and unresolved operations.
- Shop: `/provider/finance` shows only its own orders and settlement status.
- Full refunds are requested per original Payment row after cancellation. No partial-refund workflow is implemented.
- Gross payouts are eligible only after completion and exact full payment. Commission, gateway fees, tax withholding, payout schedules and bank onboarding are NOT configured; no rates are invented.
- Legacy manual refund recording delegates to the same operation workflow; it cannot bypass the ledger.

## Storage and invariants

`MoneyOperation` is a durable operation journal, not a general ledger or a bank account balance. `amountMinor` is integer satang; legacy `Order` and `Payment` amounts remain integer baht. The gateway boundary uses THB/satang exclusively.

Unique business keys identify deposit, balance, payout, and each original-payment refund. Reserve and claim the operation before contacting a gateway. Provider calls happen outside database transactions. Payment records, order transitions, journal success, order events and notifications commit together. Cancel/pay and provider acceptance/cancel compete through conditional order writes.

`CREATED -> PROCESSING -> SUCCEEDED | FAILED | PENDING | UNKNOWN`.

`PENDING` and `UNKNOWN` never trigger automatic re-execution. Reconciliation retrieves the SAME provider operation, then invokes the same atomic finalization. Abandoned `PROCESSING` can be retrieved after 60 seconds; fresh processing cannot be reconciled. `FAILED` is terminal for now: resolve with the provider/support rather than issuing a new automatic attempt. Never reset an uncertain operation or manufacture a new idempotency key to retry it.

The mock creates synthetic receipts only when execute is called. Local-development mocks read process-local receipts. Explicit private staging uses `MockGatewayReceipt` in PostgreSQL, so retrieval survives process restart. Both return UNKNOWN for absent receipts and never invent successful payments. Staging enforces unique receipt keys, reads the winning receipt after a concurrent unique-key conflict, and rejects changed request contents. This is not a bank ledger. Real adapters must implement provider retrieval semantics. A negative reconciliation response remains UNKNOWN when it could race with an in-flight settlement submission.

## Adding the chosen provider later

Implement `PaymentGateway` in `src/server/payment-gateway.ts`, then explicitly configure it in `integrations.ts`:

1. Use hosted/tokenized card entry. Never store card numbers, security codes, or raw bank credentials here.
2. Enforce operation idempotency remotely and preserve immutable amount, currency and merchant/recipient mapping. Add the provider's hosted payment/QR payload to the initiation API and UI.
3. Map asynchronous initiation to PENDING; only authoritative provider confirmation may mark success. Browser redirects are never proof of payment.
4. Add provider-specific verified webhook handling (signature, replay checks, event IDs, amount/currency/account checks) and feed the same finalization/reconciliation path. There is intentionally no unauthenticated generic success-webhook endpoint today.
5. Implement refund against each original payment reference and payouts to verified recipients. Confirm payout timing, supported marketplace structure and settlement terms with the provider.
6. Add provider sandbox contract tests, delivery retries/monitoring and reconciliation jobs. Validate max amounts and the baht/satang conversion for that provider.

There are no real gateway credentials, automatic bank transfers, or live payment activation in this change.

## Local database and verification

The new table is additive. Existing local data was backed up to `prisma/dev.db.before-money-operations` before schema sync. Keep this ignored backup private.

Apply schema using the repository's existing Prisma workflow (`prisma generate`, then `prisma db push`); do not seed/reset a database containing user data. For a production PostgreSQL deployment, create and review migrations separately.

Integration tests require an ISOLATED SQLite database with the current schema. The test files refuse a URL without a `money-test.db` filename. Never point them at the development or production database.

PowerShell example after provisioning `storage/tests/money-test.db` with the current schema:

```powershell
$env:DATABASE_URL='file:D:/saan/storage/tests/money-test.db'
node --conditions=react-server --import tsx --test tests/payments.integration.test.ts tests/settlements.integration.test.ts
```

Tests cover duplicate deposit/balance/refund/payout calls, cancellation races, timeout/pending/stale-operation recovery, failed local finalization, ownership boundaries, legacy overpayments and completion, and payout eligibility. Database fixtures live only in the isolated ignored test database.
