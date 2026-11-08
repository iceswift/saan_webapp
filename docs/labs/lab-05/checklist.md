# Lab 5 checklist - Saan

This is the durable progress tracker for Lab 5. Update it when work is completed so a later session can resume without relying on chat history.

**Scope:** Lab 5 only. Sprint 1 is complete and tracked separately.

**Submission rule from LEB2:** one PDF per team, named `lab5_sec<section>_<group>.pdf`, submitted on LEB2. Due 15 November 2026 at 23:59.

**Evidence rule:** mark an item complete only after checking the real GitHub/GCP/app result. A local edit, an attempted action, or a drafted document is not proof of completion.

## Current state

- Repository: [iceswift/saan_webapp](https://github.com/iceswift/saan_webapp), Public.
- Team members: GitHub collaborators `@iceswift` and `@ikmie`; verify the course-required student names before making the PDF.
- `staging` branch exists on GitHub.
- GitHub has the `lab5` label, a Lab 5 project board, and Issues #18-#22 tracking work.
- Two branch rulesets are Active after the repository became Public. The PR ruleset targets `main` and `staging`, requires PRs, one approval, latest-push approval, resolved conversations, up-to-date branches, and three required CI checks: `Types, lint and integration tests`, `PostgreSQL migrations and constraints`, and `Docker production image`; force pushes and deletion are blocked.
- PR [#23](https://github.com/iceswift/saan_webapp/pull/23) targets `staging` from `codex/lab5-ci-docs`; it was reopened after the teammate's review and has the `lab5` label. Runs #75/#76, #80/#81, #82/#83, and #84/#85 passed on earlier revisions. The teammate reviewed the original five-file version and closed it with findings; fixes are now being prepared on the same PR. Request a fresh formal approval after the latest push.
- Docker now directs uploads to `/data/uploads`, matching the prepared directory and the existing Compose mount path. This does not prove Cloud Run persistence; that remains unverified.
- The local checkout remains on `main` because writing a Git ref under `.git` was denied; unrelated coursework edits are not part of the Lab5 branch.
- Draft docs exist at `deployment.md` and `submission.md`.
- No GCP resources have been provisioned and no GCP deployment, rollback, or persistence drill has been run.
- Saan uploads currently use local filesystem storage. Cloud Run local disk is not durable; upload persistence needs a verified solution before claiming R-04 complete.
- Do not expose Saan's private staging test mode publicly. Keep secrets and personal data out of GitHub, screenshots, and the PDF.

## Checklist

### A. Repository and team workflow

- [x] Confirm the correct repository is `iceswift/saan_webapp`.
- [x] Create `staging` on GitHub.
- [x] Create and apply the `lab5` issue label.
- [x] Create the Lab 5 project board and add Issues #18-#22.
- [x] Verify `@ikmie` has write permission.
- [x] Apply the `lab5` label to PR #23 and verify it is visible.
- [x] Make the repository Public as required for grading; verify it is visible as Public.
- [x] Configure Active PR rules for `main` and `staging`; verify they remain Active after the visibility change.
- [x] Review the actual GitHub ruleset after the CI change; add `Docker production image` as a required check.
- [x] Confirm GitHub Actions is enabled and inspect successful push and pull request workflow runs (#75/#76, #80/#81, #82/#83, #84/#85).
- [ ] Use feature branch → PR to `staging` → release PR to `main`; do not use direct pushes for Lab5 work.

### B. R-01 / R-02 - Docker and configuration

- [x] Inspect the existing Saan Dockerfile, `.dockerignore`, and environment contract.
- [x] Document the Saan deployment assumptions in `deployment.md`.
- [x] Review the starter-kit Docker requirements against Saan and record deliberate differences in `deployment.md` (single Next.js service vs. split Vite/Express, Node 22 vs. 24, Prisma 6, runtime image and environment contract).
- [x] Document required runtime variables; clear the example admin phone and verify examples contain placeholders/disabled defaults only.
- [x] Build the production image after setting Docker's `UPLOAD_DIR=/data/uploads`; runs #82 and #83 passed on commit `448d6e0cf328f6e92a99dd74d63798f274cb120b`, tag `saan:ci-${GITHUB_SHA}` (built only, not published).
- [ ] Confirm the image starts with the intended production configuration and a non-root runtime user.

### C. R-05 / R-06 - CI and merge gate

- [x] Existing CI checks types, lint, integration and PostgreSQL migration/constraint work.
- [x] Add a Next.js production build to the local CI workflow.
- [x] Add a Docker image build that does not publish the image.
- [x] Add serialized CI coverage for non-integration TypeScript unit/security suites and the Linux scheduled-backup test.
- [x] Configure the Docker runtime upload path as `/data/uploads`, matching the prepared mount directory; a durable GCP mount/object store is still pending.
- [x] Commit only the Lab5 workflow, Docker, test-runner and documentation files to `codex/lab5-ci-docs`; preserve unrelated user changes in the local checkout. The local checkout remains on `main`.
- [x] Reopen PR #23 targeting `staging`; it remains Draft pending a fresh formal teammate approval after fixes.
- [x] Push the CI workflow change and verify the new check name `Docker production image` appears on the real PR.
- [x] Add `Docker production image` to required status checks after GitHub reported the check context.
- [ ] Use a normal PR with a deliberately failing check to prove merge is blocked; close it without merging.
- [ ] Capture the failing check, required label/blocked merge state, then a passing PR with teammate review.

### D. R-03 / R-04 - GCP service and durable data

- [ ] Confirm the team's GCP project, billing/quota and chosen region before provisioning anything.
- [ ] Adapt the guide's Cloud Run, Cloud SQL PostgreSQL and Artifact Registry plan to this repository.
- [ ] Choose and implement a durable upload store or supported persistent mount; verify bytes survive service replacement.
- [ ] Prepare least-privilege runtime and deploy identities.
- [ ] Configure GitHub OIDC / Workload Identity Federation; do not create a service-account JSON key.
- [ ] Store runtime credentials in Secret Manager and GitHub deployment values in a protected Environment; never record secret values in this checklist.
- [ ] Keep simulated login/payment behavior private and ensure the public deployment uses safe production settings.
- [ ] Run PostgreSQL migrations before rollout and verify the service's health/readiness endpoints.
- [ ] Capture service revision, database connectivity, and persistence evidence.

### E. R-07 to R-10 - Release, deployment and rollback

- [ ] Configure a deploy workflow that runs only after the reviewed `main` release and uses the full commit SHA as image tag.
- [ ] Verify CI passes before image publication/deployment.
- [ ] Verify migration failure prevents service rollout.
- [ ] Deploy one reviewed release and run a smoke check against the resulting URL.
- [ ] Demonstrate rollback to a previously built SHA; confirm the service revision and smoke check.
- [ ] Record that image rollback does not reverse database migrations and check schema compatibility.
- [ ] Restore the intended release after the rollback demonstration.

### F. R-11 / R-12 - Team evidence and final submission

- [ ] Collect links/screenshots for Docker, CI, failing PR gate, reviewed PR, GCP deploy, persistence and rollback.
- [ ] Record both teammates' actual work across implementation, review, deployment and evidence; do not invent contributions.
- [ ] Replace every `TBD` in `submission.md` with verified information.
- [ ] Confirm course section, group number and names required on the cover.
- [ ] Remove secrets, tokens, private URLs, personal data and unsupported claims from evidence.
- [ ] Render and inspect the final PDF; confirm it is one PDF per team named `lab5_sec<section>_<group>.pdf`.
- [ ] Submit the PDF on LEB2 and verify the upload.

## Resume notes

1. Start with this checklist and update status as work is verified.
2. Preserve the existing unrelated edits in `docs/coursework/`.
3. Continue from Draft PR #23. Get the teammate's review, resolve any feedback, then merge only after required checks pass. Do not merge while it remains Draft.
4. Do not provision GCP or incur cloud charges until the team confirms the project and cost scope.
5. Keep `deployment.md` and `submission.md` aligned with actual results; the final PDF comes after evidence is complete.

