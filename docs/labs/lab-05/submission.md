# Lab 5 team submission — working draft

> This file is the evidence-ready structure for the required team PDF. It is not proof of deployment. Replace placeholders only with verified evidence, then export one PDF as `lab5_sec<section>_<group name>.pdf` and submit it on LEB2.

## Team and project

- Course section: **TBD**
- Group name: **TBD**
- Members and student IDs: **TBD — verify exact course spelling for both members**
- Contribution summary: **TBD — record actual work by each member**
- Project: Saan (`iceswift/saan_webapp`), same team application as Sprint 1
- Due date shown in LEB2: 15 November 2026, 23:59

## Part 0 - Team and Evidence Index

Saan is a Thai-language marketplace for spirit-house services. The team uses a public GitHub repository with feature work reviewed into `staging` and an approved release PR into `main`.

| Evidence item | Link/screenshot to insert | Requirement/status |
|---|---|---|
| Public repository and Lab 5 issues/board | TBD | R-01, R-09, R-10 |
| Team members and individual contributions | TBD | R-11 |
| Bounded teammate AI-review prompt and actual review record | `peer-review-prompt.md`; teammate-provided `prompt_02_response.txt` | AI findings received; formal GitHub review still pending |
| CI and Docker PR checks | TBD | R-02, R-05 |
| Failing required check blocked from merge | TBD | CI quality gate |
| Reviewed release PR and merge to `main` | TBD | R-07, R-09 |
| Cloud Run, Cloud SQL and release run | TBD | R-03, R-04, R-07, R-08 |
| Upload/database persistence after replacement | TBD | R-04, C-05 |
| Rollback and compatibility check | TBD | R-07, R-08 |

Use screenshots with short captions, dates and links. Redact credentials, personal phone numbers, billing/payment details and private account identifiers. Do not include unverified plans as completed evidence.

## Part 1 - CI and Quality Gate

### Implementation

The repository's CI checks route types, lint, unit/security and integration suites, PostgreSQL schema/migrations/constraints, Next.js production build, and a production Docker image build. CI does not publish images for pull requests. A reviewed `main` release uses the reusable CI workflow as a deployment prerequisite.

### Evidence to attach

- [ ] Feature PR shows all required checks passing and teammate review on the final head.
- [ ] Failing-check PR shows the required failure and GitHub's blocked-merge state; it was not merged.
- [ ] Release PR shows final approval, successful checks, and merge SHA.
- [ ] GitHub branch protection and issue/board workflow are shown.

Prior evidence: PR #23 was approved and merged to `staging`; PR #24 showed merge blocked on a failing check and was closed; prior release PR #25 was merged to `main`. Lab 5 implementation PR [#27](https://github.com/iceswift/saan_webapp/pull/27) is open against `staging`; CI run 119 passed all three required jobs with the tagged candidate URL correction. Formal GitHub review/approval and the release PR to `main` remain pending.

## Part 2 - Docker and Reproducible Configuration

### Saan adaptation

The Starter Kit's Vite frontend and Express API are not copied because Saan is a single Next.js service. The existing multi-stage Dockerfile builds with Node 22, Prisma PostgreSQL schema, and runs as non-root UID 1000. The image listens on port 3000 and uses `/data/uploads` as its upload path. Next.js public metadata is baked into the image at build time; therefore the confirmed HTTPS service URL must be supplied as `NEXT_PUBLIC_SITE_URL` during release build.

### Configuration and local commands

See `docs/labs/lab-05/deployment.md` for the variable-by-variable runtime contract. Secret values belong in Secret Manager/GitHub protected configuration and are intentionally absent from this PDF/repository.

```sh
npm ci
npx next typegen
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run db:postgres:check
npm run build
docker build --tag saan:local .
```

Run database tests/migrations only against isolated disposable PostgreSQL. `npm run db:seed` is development-only and is not a production initialization command.

### Evidence to attach

- [ ] Final PR's passing Docker build check.
- [ ] Image SHA tag and immutable digest from Artifact Registry.
- [ ] Redacted runtime configuration showing secret references and persistent upload mount.
- [ ] Optional local smoke evidence: all 8 migrations applied to disposable PostgreSQL 16; runtime UID 1000; `/api/health` returned `{"status":"ok"}`. The local test image was not published and temporary resources were removed.

## Part 3 - GCP Deployment and Persistence

### Planned topology

Cloud Run runs the public Saan container and connects to Cloud SQL for PostgreSQL. Artifact Registry stores the release image. Cloud Storage mounted at `/data/uploads` is the proposed durable upload backend, preserving the current filesystem-based storage code. GitHub Actions authenticates through Workload Identity Federation; the Cloud Run service uses a separate runtime identity.

These are implementation targets, not completed infrastructure. The protected `lab5-gcp` GitHub Environment needs verified project/resource variables and a required reviewer. GCP services, network/identity grants, secrets, database and bucket have not been provisioned or deployed in this work.

### Evidence to attach only after real execution

- [ ] Project/region/resource overview (redact personal billing details).
- [ ] Cloud Run URL, deployed full source SHA, image digest and revision.
- [ ] Migration job completion and DB-backed `/api/health` plus home route checks.
- [ ] Database row and synthetic upload readback after app revision replacement.
- [ ] Uploaded-file SHA-256 before/after replacement matches.
- [ ] Cloud SQL backup/restore or point-in-time recovery evidence if supported by selected tier.
- [ ] Confirm the URL and login/business operation meet grader access requirements.

### Access and safety status

Production OTP is not ready: the current OTP sender is test/console-only, and no production SMS provider, public domain or verified support recovery contact exists. Do not enable public test login or simulated checkout. Lab C04 (sign-in and one business operation) remains blocked until the course/instructor provides a safe, approved authentication test path. Billing and credits must be verified in the selected project before provisioning; an alert budget alone is not an enforceable cap. Do not include account-specific billing details in this public repository or claim resources are cost-covered without evidence.

## Part 4 - Repeatable Release Pipeline

### Pipeline behavior

On a push to protected `main`, the workflow requires reusable CI, builds and pushes an image tagged with the full 40-character commit SHA, resolves and deploys the image digest, executes database migrations before app rollout, creates a candidate revision with no production traffic, and checks both database-backed health and the home route. Only a passing candidate receives traffic. A failed post-promotion smoke check restores the prior revision when one exists. A manual rollback reuses a previously built SHA image and requires explicit schema-compatibility confirmation; it never automatically reverts migrations/data.

This automation is not yet exercised against GCP. It expects pre-provisioned service/job configuration; it does not create cloud resources. Do not claim release, migration gate, rollback or service persistence as passed until the GitHub run and GCP state show it.

### Evidence to attach

- [ ] Successful GitHub release workflow on a teammate-approved `main` commit.
- [ ] Full commit SHA, image digest, revision and service URL in workflow summary.
- [ ] Migration failure test (safe disposable environment) proves no traffic promotion.
- [ ] Manual rollback run shows prior image SHA and healthy restored service.
- [ ] Schema compatibility or forward-fix decision recorded for the rollback.

## Final team submission checks

- [ ] Replace all `TBD` entries with confirmed course/team data and evidence.
- [ ] Confirm both teammates participated and describe real contributions accurately.
- [ ] Ensure all screenshots and logs are redacted and match the submitted release.
- [ ] Export exactly one final PDF per team, inspect every page, and confirm its filename.
- [ ] Upload to LEB2 and open the uploaded copy to verify it is readable.
