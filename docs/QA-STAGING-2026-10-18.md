# Private staging QA — 18 October 2026 (Asia/Bangkok)

URL: https://iceberg.taile08e5c.ts.net:8443/ . Final application source/image: `793d62efe14c`. All accounts, addresses, orders, image uploads and reviews used here are explicitly synthetic; no real messages/SMS, services or payments occurred.

## Automated checks

- 38 integration tests passed against isolated SQLite `money-test.db`; includes the existing payment/settlement/order/review tests, staging enablement/production fail-closed tests, OTP expiry/attempt/replay races, and durable receipt retrieval in a separate process.
- Final production Docker build and TypeScript passed. Targeted ESLint passed.
- Isolated PostgreSQL `saan_test`: both migrations applied, schema drift check empty, uniqueness/foreign keys/rollback passed. A concurrent receipt upsert failed on real PostgreSQL despite passing SQLite; final implementation handles P2002 by reading the winning immutable receipt. The same test then passed on the final image, including a separate-process retrieval and reordered equivalent request.
- Staging seed executed twice successfully; no existing orders, receipts, uploads or accounts were deleted. This is not the destructive development seed.

## Browser checks

1. A phone outside the staging allowlist (0800000009) was refused without reaching an OTP step.
2. Synthetic customer 0800000002 logged in with its displayed, random test OTP over HTTPS.
3. Ordered synthetic product `staging-product`, selected a future Thai calendar date and fictional saved address/pin. Order SN-459182 total ฿1,000.
4. Uploaded a generated one-pixel PNG through the authenticated chat attachment control and sent explicit test text. Image/message survived app replacement and appeared to the synthetic shop.
5. Simulated ฿300 deposit; UI showed success and no real charge notice.
6. Synthetic shop 0800000003 logged in, saw the image/message and order, confirmed 25 October 2026 09:00 Bangkok, recorded explicit test progress and marked work complete.
7. Customer accepted and simulated ฿700 balance; order became completed and a clearly labelled test review was saved.
8. Created a second order SN-488303, simulated ฿300 deposit, cancelled before shop acceptance.
9. Synthetic admin 0800000001 logged in to finance, simulated refund of SN-488303 and payout of SN-459182. Audit history showed 3 completed operations on the completed order, 2 on the cancelled order, with no remaining payable balance.
10. Recreated the final app container and restarted its proxy. Existing admin session and financial results remained intact. Screenshot: ignored local `output/playwright/staging-finance-after-restart.png`.

## Boundaries

These tests verify private staging simulation only. They do not validate SMS delivery, card/PromptPay provider integration, regulatory settlement policies, public exposure, full responsive/accessibility coverage or load capacity. Dependency audit findings from the existing lockfile still need triage before public launch. GitHub Actions remains billing-blocked; tests above were actually run locally/on the home server.

Backup copies remain on the home server by the owner's explicit choice. No data was transferred to another device. Post-test backup `20261018T043208Z-2239166` was restored into a separate empty `saan-restore-testmode` stack: health passed, all PNG checksums matched, and both the provider-receipt and successful-operation counts were 5. Temporary drill containers were stopped and their data retained.
