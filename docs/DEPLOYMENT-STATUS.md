# Deployment status

Updated 2026-10-18. See OPERATIONS.md for architecture and runbook.

- Home server reachable over SSH; existing services inspected read-only.
- PostgreSQL migration, portable image/Compose, stable upload path, database health endpoint and backup/restore scripts prepared.
- No real payment or SMS provider configured. Production builds reject payments.
- Live build, deployment and restore drill: pending; update this file with verified results.
- Off-machine backup destination, scheduling and retention: not configured.
- GitHub-hosted Actions blocked by account billing. Local results must be recorded separately.
