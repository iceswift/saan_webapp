# Lab 5 checklist — Saan

Sprint 1 is closed and tracked separately. This is the persistent Lab 5 tracker; mark an item complete only when its linked evidence is verified.

**Submission:** one PDF per team on LEB2 named `lab5_sec<section>_<group name>.pdf`; due 15 November 2026 at 23:59.

## Verified repository state

- Repository: [iceswift/saan_webapp](https://github.com/iceswift/saan_webapp), Public.
- [PR #23](https://github.com/iceswift/saan_webapp/pull/23) was approved and merged to `staging`; the three required CI checks passed on head `8c197af`.
- [PR #24](https://github.com/iceswift/saan_webapp/pull/24) demonstrated a failing required check; GitHub blocked merge and the PR was closed without merging.
- [PR #25](https://github.com/iceswift/saan_webapp/pull/25) was merged to `main` before this Lab 5 pipeline branch was prepared. The new implementation must still pass through its own feature PR and final release PR.
- A local production-container smoke test applied all 8 migrations to disposable PostgreSQL 16, verified a non-root runtime and `/data/uploads`, and received `{"status":"ok"}` from `/api/health`. That image was not published; temporary resources were removed.
- GCP resources, public deployment, durable GCP upload verification and rollback drill are **not yet verified**.

## A. Lab brief, team and submission

- [x] Use the same project/application and public repository as Sprint 1.
- [ ] Record the course section and exact team/group name.
- [ ] Record both members' course-required names and IDs, and their actual contributions.
- [ ] Share `peer-review-prompt.md` with the teammate for bounded Gemini review and record only the actual model/result; teammate must still personally review the PR.
- [ ] Collect evidence captions and links for Parts 0–4.
- [ ] Replace every placeholder in `submission.md` with verified facts/evidence.
- [ ] Render and inspect the final PDF named `lab5_sec<section>_<group name>.pdf`.
- [ ] Submit one PDF on LEB2 and verify it opens after upload.

## B. CI, quality gate and team Git workflow

- [x] Public repo and `staging`/`main` release flow are in use.
- [x] Required CI checks and branch protection were demonstrated on prior PRs.
- [x] Failing-check merge block was demonstrated by PR #24.
- [x] Original Lab documentation aligned to the official Part 0–4 headings.
- [ ] New reusable CI/release changes pass on a feature PR; capture final checks and teammate review.
- [ ] Teammate reviews the final release PR and approves the exact final head.
- [ ] Capture feature issue/board card → feature PR → `staging` → release PR → `main` evidence.
- [ ] Keep the `lab5` label and issue history; do not rewrite or delete historical evidence.

## C. Docker and reproducible configuration

- [x] Saan Docker adaptation is documented; the Starter Kit's Vite/Express commands are not applicable.
- [x] CI builds a production image without publishing it on PRs.
- [x] Local production-container smoke against disposable PostgreSQL verified migrations, UID 1000, uploads directory and DB-backed health.
- [x] Documented required/runtime environment variable names without values or secrets.
- [ ] Reusable CI and static deploy-script checks pass on the final pipeline commit.
- [ ] Reviewed `main` image is pushed using its full 40-character commit SHA and recorded by digest.

## D. GCP deployment, operation and persistence

- [ ] Confirm project, region, quota, free-trial credit/billing status and actual budget controls in the account.
- [ ] Do not provision while the console still shows an unresolved prepayment/upgrade requirement or no enforceable limit.
- [ ] Provision Cloud Run, Cloud SQL, Artifact Registry, persistent uploads, IAM/WIF and secrets using the approved course project.
- [ ] Keep public test login, console OTP, mock checkout, real payments and SMS disabled.
- [ ] Deploy the reviewed commit; capture full SHA, image digest, revision and public URL.
- [ ] Verify migration job success and DB-backed health/home smoke from the candidate revision.
- [ ] Upload a synthetic file and prove the same URL and bytes survive service replacement/redeploy.
- [ ] Verify database record survives app revision replacement; perform a backup/restore drill if supported.
- [ ] Keep the app accessible until the instructor ends grading, subject to the confirmed budget/credits.
- [ ] Capture redacted GCP evidence. Never publish credentials, account identifiers, phone numbers or payment details.

## E. Repeatable release and rollback

- [x] Pipeline source prepares SHA-tagged image, migration-before-rollout, no-traffic candidate smoke, traffic promotion and a rollback action requiring schema compatibility.
- [ ] Verify GitHub WIF authentication is keyless and restricted to reviewed `main`.
- [ ] Verify a migration failure blocks deployment before traffic changes.
- [ ] Execute one reviewed release from `main`; confirm release summary has full SHA, digest, revision and service URL.
- [ ] Roll back to a previous SHA image; confirm health and document schema compatibility (or use a documented forward fix if unsafe).
- [ ] Capture completed workflow runs and final service state.

## F. Known acceptance blockers

- Billing verification is unresolved. Verify active credit and enforceable spend controls in the project before provisioning; alerts alone do not establish a hard spend cap. Do not commit account-specific billing details.
- Production authentication is not ready: no production SMS provider, public domain or verified recovery contact is configured. Private test login cannot be exposed publicly. This blocks an honest Lab C04 end-to-end authenticated operation until the course team provides an approved test path.
- GCP service, migrations, Cloud SQL durability, GCS upload persistence and rollback have not been exercised.
- Final submission PDF has not been rendered or submitted.

## Resume protocol

1. Check this file, the PR/workflow state, `docs/DEPLOYMENT-STATUS.md`, and the protected GCP Environment before resuming.
2. Keep implementation on the Lab 5 branch/PR and preserve unrelated local coursework changes.
3. Continue only from the next unchecked item with observable evidence; do not mark plans as deployed results.
