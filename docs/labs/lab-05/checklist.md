# Lab 5 checklist - Saan

This is the durable progress tracker for Lab 5. Sprint 1 is complete and tracked separately.

**Submission:** one PDF per team on LEB2 named `lab5_sec<section>_<group>.pdf`; due 15 November 2026 at 23:59.

## Current state

- Repository: [iceswift/saan_webapp](https://github.com/iceswift/saan_webapp), Public.
- PR [#23](https://github.com/iceswift/saan_webapp/pull/23) was approved by a teammate and merged into `staging`; its three required CI checks passed on head `8c197af`.
- Temporary PR [#24](https://github.com/iceswift/saan_webapp/pull/24) demonstrated the CI merge gate. The required check failed, GitHub displayed “Merging is blocked”, and the PR was closed without merging.
- A local production-container smoke test applied all 8 migrations to disposable PostgreSQL 16, confirmed a non-root runtime, confirmed uploads use `/data/uploads`, and received `{"status":"ok"}` from `/api/health`. The image was not published; temporary resources were removed.
- Release PR [#25](https://github.com/iceswift/saan_webapp/pull/25) from `staging` to `main` passed all three required checks and received teammate approval. It needs a refreshed review after the documentation update.
- No GCP resource or service has been provisioned or deployed. Cloud Run file durability and deployment/rollback evidence remain pending.
- The local checkout is on `main`; unrelated coursework changes are preserved.

## Checklist

### A. Repository and team workflow

- [x] Use the correct public repository.
- [x] Create the `staging` branch and Lab 5 tracking items.
- [x] Configure and verify branch protections and required CI checks for the release branches.
- [x] Use feature branch → reviewed PR to `staging` → release PR to `main`.
- [x] Merge the approved feature PR #23 into `staging`.
- [ ] Obtain fresh approval and merge the updated release PR #25 into `main`.

### B. Docker and configuration

- [x] Adapt the existing Docker setup to Saan.
- [x] Document the difference between the Starter Kit and Saan.
- [x] Build the production image in CI without publishing it.
- [x] Smoke-test a local production container against disposable PostgreSQL: migrations, non-root runtime, uploads path and health response all passed.
- [ ] Verify the final release image and retain its build evidence.

### C. CI and merge gate

- [x] CI covers types, lint, unit/security suites, integration checks and PostgreSQL migrations/constraints.
- [x] CI builds the Next.js production app and Docker image without publishing.
- [x] Required CI checks passed on approved PR #23 and release PR #25.
- [x] Demonstrate a failing required check with PR #24; confirm GitHub blocks merge and close the PR without merging.
- [ ] Capture the final reviewed release PR evidence after the documentation update.

### D. GCP service and durable data

- [ ] Confirm the team's GCP project, region, billing/quota and budget before provisioning.
- [ ] Adapt the Cloud Run, Cloud SQL and Artifact Registry plan to the confirmed project.
- [ ] Select and verify a durable upload store; confirm uploaded bytes survive service replacement.
- [ ] Configure the deployment workflow and managed runtime configuration.
- [ ] Deploy the reviewed release, run migrations, and verify health/readiness.
- [ ] Capture service revision, database connectivity and persistence evidence.

### E. Release and rollback

- [ ] Publish the reviewed image using the full commit SHA.
- [ ] Verify a migration failure prevents rollout.
- [ ] Demonstrate rollback to a previously built image and verify health.
- [ ] Record database compatibility and restore the intended release.

### F. Team evidence and final submission

- [ ] Collect links/screenshots for Docker, CI, the failing gate, reviewed release, deployment, persistence and rollback.
- [ ] Record both teammates' actual contributions.
- [ ] Confirm section, group and course-required names.
- [ ] Replace every `TBD` in the working submission document.
- [ ] Render and inspect one final PDF named `lab5_sec<section>_<group>.pdf`.
- [ ] Submit the PDF on LEB2 and verify the upload.

## Resume notes

1. Keep this checklist aligned with verified GitHub and GCP results.
2. Preserve unrelated coursework changes in the local checkout.
3. Update PR #25 after the public-safe documentation changes, rerun checks and obtain approval on the final head before merging.
4. Do not create GCP resources or incur cloud charges until the team confirms the project and budget.
5. Complete the final PDF only after deployment evidence and team details are verified.
