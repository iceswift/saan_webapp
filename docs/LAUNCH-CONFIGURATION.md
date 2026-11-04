# Launch configuration inventory

Owner confirmed 4 November 2026 that no domain, SMS account or support/alert channel exists yet. Prepare only; do not activate external services.

## Public support contacts

`SUPPORT_EMAIL`, `SUPPORT_PHONE`, `SUPPORT_LINE_URL` are optional server-runtime variables. Keep empty until the owner supplies real channels. Valid values are deliberately public on `/help`; never put credentials in these fields. No rebuild is needed, but recreate the app with the updated protected deployment environment. Compose passes them explicitly. Configuration does not send a message.

The old blank `SUPPORT` constant is no longer the help page's configuration source; do not add real channels there. Use the protected runtime environment.

Email/Thai phone syntax is checked; phone variants canonicalize. LINE accepts only supported HTTPS contact paths on `lin.ee` or `line.me`, with no credentials/query/fragment/alternate port. Malformed channels are hidden from help and reported to admins by channel name without raw values. The customer fallback remains the in-app order conversation, with no invented contact.

## Administrator inventory

`/admin/operations` adds a role-protected "ก่อนเปิดใช้งานจริง" inventory. Configured syntax is separate from verification: a public HTTPS origin does not prove DNS/certificate ownership; a contact does not prove an operator will answer. SMS, external alerts, live money and off-machine backups remain blocked. `launchConfiguration().canLaunch` is always false in this preparation release.

`SMS_PROVIDER=unconfigured`, `SMS_SEND_ENABLED=false` are inventory defaults, not a provider adapter. Other providers/an enabled flag report unsupported configuration; they do not send SMS or bypass private login. Production implementation gates remain in PRODUCTION-AUTH-READINESS.md.

## OTP follow-up

Verification selects the newest challenge, including consumed/expired/locked state, and never falls back to an older one. This prevents an old code becoming usable after the newest is consumed or expires. Existing conditional consumption still guards replay. No schema change. Production digest storage, atomic issue/resend, delivery handling, abuse budgets and retention remain outstanding.

## Verification

Configuration tests cover missing services, safe links, injected values, redaction and false launch authorization. OTP regression covers older-code resurrection after consumed/expired/locked challenges. The serial PostgreSQL runner now includes OTP; provider-order/review suites remain SQLite-only. Current deployed evidence belongs in DEPLOYMENT-STATUS.md.

Verified 4 Nov on `saan:launch-ready-6149581811c7`: four configuration tests, 65 SQLite integration cases and 55 serial PostgreSQL cases passed, with TypeScript/targeted lint/Linux build. Browser admin inventory shows all six unconfigured/blocked items; help shows no email/telephone/LINE destination and retains the order-chat fallback. Request/resend rejected the replaced test code and accepted the newest; customer access to `/admin/operations` redirects home. Customer session restored; no real contact/service configured or external message submitted. Screenshot: ignored `output/staging/launch-readiness-admin.png`.
