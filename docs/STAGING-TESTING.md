# Private staging tests

This mode is for synthetic data inside the private tailnet only. It does not send SMS, contact a payment provider, or move money. Never expose it publicly or reuse real users' phone numbers.

Enable all four runtime values deliberately in the protected deployment environment:

```ini
APP_ENV=staging
STAGING_TEST_MODE=true
STAGING_TEST_PHONES=0800000001,0800000002,0800000003
PAYMENT_PROVIDER=mock
```

Production mode (`APP_ENV=production`, or `NODE_ENV=production` without the explicit staging configuration) rejects test login and disables mock payments. There is still no real SMS/payment adapter. Removing a phone from the staging allowlist also invalidates its session on the next server check. This does not replace network access controls: staging must remain private to Tailscale.

After backing up, migrate using the new image and run `npm run db:seed:staging` inside the app image. The staging seed is additive and repeatable: it creates three synthetic accounts, one test shop, one product at ฿1,000 and one fictional address. It refuses to replace accounts belonging to another ID and never deletes existing orders, receipts or uploads. **Do not use `npm run db:seed` on staging**; that development command deletes data.

| Phone | Role |
|---|---|
| 0800000001 | Admin |
| 0800000002 | Customer |
| 0800000003 | Shop |

Request an OTP in the login UI; the generated test code is displayed there. No fixed PIN and no reading private server logs is needed. Codes expire, have attempt limits, and a code can only be redeemed once even under concurrent requests. A staging label is shown globally, and existing payment screens display their mock-payment notices.

Mock provider receipts are stored in `MockGatewayReceipt` separately from the application payment ledger. Executing the same key returns the same receipt; different request contents with the same key are rejected. Retrieval from another process or after restart reads the existing receipt and never creates a successful receipt for an unknown operation. Database backup/restore includes this table. Local-development mock receipts remain process-local; test injected gateways are unchanged.

Verify on each release: customer login → order → deposit → shop confirmation → job completion → customer acceptance/final payment → review → admin payout. Also test cancellation/refund, disallowed phone login, authenticated image upload, page reload and app recreation. Record actual observed results in DEPLOYMENT-STATUS.md rather than assuming unit tests prove browser behavior.

To disable: set `STAGING_TEST_MODE=false` and `PAYMENT_PROVIDER=unconfigured`, recreate app and restart proxy. Existing staging sessions then fail the allowlist gate. Keep synthetic fixtures/data for later tests unless the owner explicitly requests their removal.
