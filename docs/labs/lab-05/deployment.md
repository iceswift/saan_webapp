# Lab 5 deployment and CI/CD plan

Status: source and CI preparation is complete. GCP deployment, durable upload verification and rollback evidence are still pending.

## Release flow

1. Develop on a feature branch and open a pull request to `staging`.
2. Review and merge only after required checks pass and a teammate approves.
3. Open a release pull request from `staging` to `main`.
4. Deploy only the reviewed release, retaining its commit and image build evidence.
5. If rollback is needed, use a previously built image and verify database compatibility; an image rollback does not reverse database changes.

The repository has active branch protections and required CI checks for its release branches. The required checks are Types, lint and integration tests; PostgreSQL migrations and constraints; and Docker production image.

## CI

The workflow runs on pushes and pull requests. It checks route types, lint, unit/security suites, integration coverage, PostgreSQL migrations and constraints, a Next.js production build, and a Docker image build that does not publish the image.

## Starter Kit adaptation

The Starter Kit uses a React/Vite frontend, an Express API and Node 24. Saan is a single Next.js App Router service using Node 22 and Prisma 6, so its existing multi-stage Docker build is the appropriate adaptation; the separate frontend/API containers and Vite/Express commands do not apply.

Saan stores uploaded files on the filesystem and serves stable file URLs. The Docker image uses `/data/uploads`, matching the existing deployment mount path. A container path alone does not provide durable storage on Cloud Run. Before relying on uploads after an instance replacement, configure and verify a durable storage solution.

The production image removes development dependencies. The container is built to run as a non-root user. CI builds the image but does not publish or deploy it.

## Verified status

- [PR #23](https://github.com/iceswift/saan_webapp/pull/23) was approved by a teammate and merged to `staging`; all three required checks passed on head `8c197af`.
- [PR #24](https://github.com/iceswift/saan_webapp/pull/24) demonstrated the failing-check gate. GitHub showed “Merging is blocked”; the PR was closed without merging.
- A local production-container smoke test applied all 8 migrations to disposable PostgreSQL 16, verified a non-root runtime and the upload path, and received `{"status":"ok"}` from `/api/health`. The local image was not published and test resources were removed.
- [Release PR #25](https://github.com/iceswift/saan_webapp/pull/25) passed all required checks and received an initial teammate approval. It requires a refreshed review after this documentation update.
- No GCP resource or service has been provisioned or deployed.

## GCP setup gate

The course guide describes a deployment using Cloud Run, Cloud SQL for PostgreSQL, an image registry and managed cloud configuration. Adapt its steps only after the team confirms its own project, region, quota and budget. Keep deployment values out of repository source.

Saan's uploads currently use the container filesystem. Cloud Run instance-local files do not establish durable upload storage. Select a supported persistent mount or object-storage approach and verify file bytes after an instance replacement before marking persistence complete.

## Final evidence

The team PDF should link to or show:

1. The reviewed feature PR and passing required checks.
2. The deliberately failing PR and blocked merge state.
3. The release PR and its final review/check results.
4. The deployment, migration and health/readiness evidence.
5. Database and uploaded-file persistence after a service replacement.
6. A rollback to a previously built image and the compatibility check.

Use only evidence from the team's repository and confirmed cloud project. Exclude credentials and personal data.
