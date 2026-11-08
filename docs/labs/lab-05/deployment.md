# Lab 5 deployment and CI/CD plan

Status: preparation in progress. This document is adapted to Saan and records the work still required; it does not claim that a GCP deployment has happened.

## Repository release flow

1. Develop on a feature branch and open a pull request to `staging`.
2. The teammate reviews the pull request. Merge only after the required review and CI checks pass.
3. Open a release pull request from `staging` to `main`; review it and wait for the same checks.
4. Deploy only a reviewed `main` release. Keep the commit SHA and resulting image digest in the release evidence.
5. Roll back by redeploying a previously built image only after checking that the current database schema is compatible. Image rollback does not reverse database migrations.

The GitHub ruleset `Lab 5 protected PRs: main and staging` now requires pull requests, one approval, approval of the latest reviewable push, resolved conversations, up-to-date branches, and three CI status checks: `Types, lint and integration tests`, `PostgreSQL migrations and constraints`, and `Docker production image`. Force pushes and deletion are blocked. The old owner-only update restriction was removed so a teammate with write access can merge a passing reviewed PR.

## Current CI

`.github/workflows/ci.yml` runs for pushes and pull requests. It checks route types, lint, all non-integration TypeScript unit/security suites, the scheduled-backup Python test, SQLite integration tests, PostgreSQL schema/migrations and constraints, a Next.js production build, and a Docker production image build without publishing it.

## Starter-kit adaptation notes

The Starter Kit is a reference implementation for a React/Vite frontend plus Express/Prisma API on Node 24. Saan is a single Next.js App Router service on Node 22 with Prisma 6, so its existing root Dockerfile is the adapted single-container build; the starter's separate client/server Compose Dockerfiles, Nginx frontend, Vite commands, Express entrypoint, and Node 24 image are not applicable. Saan's multi-stage build generates the PostgreSQL Prisma client, runs `next build`, retains production dependencies, and runs as the non-root `node` user. It uses a build-only placeholder `DATABASE_URL`; production credentials are supplied at runtime.

The Starter Kit README calls for sessions and uploaded files to live in the database. Saan deliberately differs: it stores uploaded images on the filesystem behind stable `/api/files/<key>` URLs, controlled by `UPLOAD_DIR`. The Docker image sets `UPLOAD_DIR=/data/uploads` to match Saan's existing Compose mount; this path comes from Saan's deployment, not from a durable-volume contract in the Starter Kit. A path by itself does not make Cloud Run local storage durable. Cloud Run still needs a verified persistent mount or object-storage implementation and a replacement/persistence drill before R-04 can be marked complete.

Saan's runtime image runs `npm prune --omit=dev`; `tsx` is a development dependency, so `npm run db:seed` is unavailable in that image. Prisma CLI remains available for the controlled migration job. Do not add an automatic seed to a public deployment without a reviewed, production-safe seed plan. The current CI workflow builds but does not publish or deploy the image; GCP deploy/migration/smoke-test automation remains pending.

### Runtime environment contract

| Variable | Purpose and handling |
|---|---|
| `DATABASE_URL` | Required PostgreSQL connection at runtime; inject from Secret Manager. The Docker build uses only a build-time placeholder. |
| `NEXT_PUBLIC_SITE_URL` | Public canonical site URL; configure for the target environment, never a credential. |
| `SITE_URL` | Optional server-side canonical URL override; keep it aligned with `NEXT_PUBLIC_SITE_URL`. |
| `UPLOAD_DIR` | Docker default `/data/uploads`; mount durable storage there before relying on uploaded images across instance replacement. |
| `OPERATIONS_DIR` | Optional filesystem location for operations status data; configure only if the deployed operations feature needs persistent state. |
| `APP_ENV`, `STAGING_TEST_MODE`, `STAGING_TEST_PHONES` | Environment classification and private test-login gate. Production must not inherit staging test mode or phone allowlists. |
| `PAYMENT_PROVIDER`, `PAYMENT_MUTATIONS_DISABLED` | Payment selection and mutation pause. Keep production in the reviewed safe configuration; mock/test payment is not real payment. |
| `OMISE_TEST_SECRET_KEY`, `OMISE_WEBHOOK_SECRET`, `OMISE_WEBHOOK_PREVIOUS_SECRET`, `PAYMENT_WORKER_SECRET` | Optional secrets for private sandbox features; set only through Secret Manager after deliberate setup, never in example files or GitHub source. |
| `OMISE_API_VERSION`, `OMISE_WEBHOOK_ENABLED`, `PAYMENT_RECONCILIATION_ENABLED` | Sandbox integration configuration. Webhook/reconciliation remain disabled unless the full private setup and endpoint protection are verified. |
| `ADMIN_PHONES`, `SUPPORT_EMAIL`, `SUPPORT_PHONE`, `SUPPORT_LINE_URL` | Optional administrator/contact configuration; use only verified values and avoid placing personal data in public examples. |
| `SMS_PROVIDER`, `SMS_SEND_ENABLED` | SMS capability flags; defaults remain unconfigured/disabled because no real SMS adapter is enabled. |

`.env.example` and `.env.staging.example` contain placeholders or disabled defaults, not live credentials. Keep actual production values outside the image and repository.

The workflow, Dockerfile adjustment, unit-test runner, and Lab 5 docs are on GitHub feature branch `codex/lab5-ci-docs` in [Draft PR #23](https://github.com/iceswift/saan_webapp/pull/23). The original review findings were addressed in commit `c24b29dad8c86f946e94d86ccb99fbab846f1aad`. GitHub Actions runs #87 (push) and #88 (pull request) passed route types, lint, all 13 non-integration TypeScript suites, the scheduled-backup Python test, integration tests, PostgreSQL migrations and constraints, the Next.js production build, and the Docker production image build. The image was built as `saan:ci-c24b29dad8c86f946e94d86ccb99fbab846f1aad`, not published. The `lab5` label and `Docker production image` required check are in place. The PR is reopened but still Draft and needs a fresh teammate approval; it is not merged. The local checkout remains on `main` because the Git directory denied local branch creation; unrelated coursework edits were excluded from the remote branch.

## GCP design and setup gate

The starter guide uses Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry, Secret Manager and GitHub Actions with Workload Identity Federation. Use the team's own project, region, resource names, repository IDs and IAM principals; do not copy the TA rehearsal IDs or credentials.

- Cloud SQL PostgreSQL is the durable database. Run `prisma migrate deploy --schema prisma/postgresql/schema.prisma` as a controlled migration step before updating the service.
- Build and tag the image with the full Git commit SHA. Publish it to Artifact Registry only from the protected deployment workflow.
- Use GitHub OIDC / Workload Identity Federation. Do not create or store a service-account JSON key in GitHub.
- Put deployment values in a protected GitHub Environment and runtime credentials in Secret Manager. The deployment identity should not read application secrets; the Cloud Run runtime identity should have only the access it needs.
- Saan currently stores uploaded files using Node's filesystem APIs (`src/server/storage.ts`) and defaults to local disk. A Cloud Run instance filesystem is not durable across instance replacement. Before a public demo that needs uploads, implement and verify durable object storage or a supported persistent mount. Do not mark upload persistence complete based on a successful container start.
- Keep test login, mocked payments and staging credentials private. Saan's operations runbook explicitly says not to expose its staging test mode publicly. Configure production-safe authentication and payment behavior before exposing a customer-facing demo.

No GCP project, service, database, bucket, registry, secrets, identity provider, or public endpoint has been provisioned by this work. No deploy has been run.

## Release verification evidence to capture

For the final Lab 5 PDF, capture links or screenshots that prove:

1. A normal pull request to `staging` with a failing CI check is blocked and is closed without merging broken code.
2. A passing pull request has the teammate's review and required checks before merge.
3. A release pull request from `staging` to `main` passes its checks.
4. The GitHub Actions run builds and publishes the SHA-tagged image, applies migrations, deploys the service and passes the health/readiness smoke test.
5. Persistent database and uploaded-file behavior survives a service replacement or restart.
6. A rollback uses an already built SHA image and passes its smoke check; document database compatibility separately.

Do not include secret values, access tokens, service-account keys, private database URLs, or personal data in screenshots or the PDF.

