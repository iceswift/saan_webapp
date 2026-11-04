# Dependency and input review — 4 November 2026

Private staging remains the deployment boundary. This review is not approval for live payments or public access.

## Changes

- Next.js 16.4.0 → 16.4.5 and matching eslint-config-next; Zod → 4.6.6. Compatible transitive fixes applied without `--force` or an unreviewed major Prisma/ESLint migration.
- The initial production audit included a critical Next.js finding. Primary advisories: [image optimization SVG execution](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Server Actions denial of service](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [Zod oversized collections](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- Move the shadcn generator to development dependencies and prune development dependencies in the runtime Docker stage. The `build` target retains testing tools. Prisma CLI remains available for the documented database migration workflow.
- Canonicalize Thai digits and Thai international phone notation before validation, so different representations use the same login identity. Reject letters and malformed numbers rather than stripping them into a valid identity.
- Login return URLs now reject external/protocol-relative/backslash/control-character destinations and login loops. Money entry accepts properly grouped whole-baht values and Thai digits; malformed groups, decimals, exponent/hex notation and out-of-range values fail validation. Ledger arithmetic is unchanged.

## Remaining audit findings

The local post-fix `npm audit --omit=dev` reports three high entries, all in the Prisma CLI/config/deepmerge-ts chain, and zero critical/moderate/low entries. These are three dependency entries, not three independently proven application exploits. The CLI consumes the repository's trusted migration configuration, not a public request field. This narrows exposure but does not resolve the advisory. An ORM major upgrade requires a separate migration/client/restore compatibility review; do not force it merely to reduce an audit count. The full development tree still has 24 entries (2 low, 19 moderate, 3 high).

Audit snapshots are local ignored files under `storage/dependency-audit-*2026-11-04.json`. Audit results are time-specific; rerun before public launch. Dependency audit is not an OS/container scan or a penetration test.

## Verification

TypeScript, targeted lint, 30 nonintegration tests and 63 isolated SQLite integration tests passed after the dependency changes. Linux image, isolated PostgreSQL and browser results belong in DEPLOYMENT-STATUS.md when actually verified. No live gateway, SMS provider, public ingress or backup destination was enabled.
