# Payments and settlements

Implemented internal flow; provider selection remains open. No real money is moved.

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
