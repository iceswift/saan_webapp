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

`.github/workflows/ci.yml` runs for pushes and pull requests. It checks route types, lint, integration tests, PostgreSQL schema/migrations and constraints, builds the production Next.js app, and builds a Docker production image without publishing it.

The workflow and Lab 5 docs are on GitHub feature branch `codex/lab5-ci-docs`, created from `staging`, in [Draft PR #23](https://github.com/iceswift/saan_webapp/pull/23). GitHub Actions runs #75 (push) and #76 (pull request) succeeded. They passed route types, lint, integration tests, PostgreSQL migrations and constraints, the Next.js production build, and a Docker production image build. The image was built as `saan:ci-00f95dc257c7b243f44ae42fe1e91e1e3e0535b5` and was not published. `Docker production image` is now a required status check. The PR remains unmerged and awaits teammate review. The local checkout remains on `main` because the Git directory denied local branch creation; unrelated coursework edits were excluded from the remote branch.

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

