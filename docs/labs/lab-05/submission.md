# Lab 5 team submission - working draft

> Working draft only. Replace every `TBD`, attach verified evidence and render the final single team PDF as `lab5_sec<section>_<group>.pdf` before submission. Do not submit this draft as proof of a deployment. Current progress: Draft PR #23 is open to `staging`; CI passed, but review and merge are pending.

## Team

- Repository: [iceswift/saan_webapp](https://github.com/iceswift/saan_webapp)
- Section: TBD
- Group: TBD
- Members: @iceswift and @ikmie (verify the names required by the course form)
- Due date shown in LEB2: 15 November 2026, 23:59

## Answer Part 0 - Application and environment

Saan is a Thai-language marketplace for spirit-house services. It uses Next.js 16, TypeScript, Docker and PostgreSQL for the deployment profile. Local development may use SQLite. The Docker image already contains a production build and runs as a non-root user. Production secrets and deployment configuration must be supplied outside the image.

Evidence: repository and Dockerfile link TBD.

## Answer Part 1 - Docker and environment configuration

- [x] Adapted the existing Dockerfile and deployment setup to Saan before this Lab 5 work.
- [x] Added an automated production Docker image build to the local CI workflow; it does not publish the image.
- [ ] Merge the CI change through the team pull request flow after teammate review.
- [x] Capture successful Docker builds after setting `UPLOAD_DIR=/data/uploads`; runs #82 and #83 passed on commit `448d6e0cf328f6e92a99dd74d63798f274cb120b`. Image tag: `saan:ci-448d6e0cf328f6e92a99dd74d63798f274cb120b`; image was not published.
- [ ] Capture safe environment-variable configuration without revealing values.

Evidence: Dockerfile, CI run link TBD.

## Answer Part 2 - CI and pull request gate

The repository now has active rules for `main` and `staging`: pull requests are required; one approval and approval of the latest reviewable push are required; conversations must be resolved; the branch must be current; force pushes and branch deletion are blocked. Required checks are `Types, lint and integration tests`, `PostgreSQL migrations and constraints`, and `Docker production image`.

- [x] Configure the protected PR rules for `main` and `staging`.
- [x] Require one teammate approval and resolved conversations.
- [x] Add production Next.js and Docker image build steps to the feature branch.
- [x] Open Draft PR #23 to `staging`; add `Docker production image` as a required status check after GitHub reported the check context.
- [x] Verify push/PR runs #75/#76, #80/#81, and #82/#83 passed all workflow jobs.
- [ ] Get teammate review, resolve feedback and merge the PR.
- [ ] Open a normal PR with an intentionally failing CI check, prove it is blocked, then close it without merging.
- [ ] Capture a passing PR with teammate review and green checks.

Evidence: ruleset and PR links/screenshots TBD.

## Answer Part 3 - GCP deployment and persistence

Planned GCP components based on the starter guide: Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry, Secret Manager and keyless GitHub Actions authentication with Workload Identity Federation. The image should be tagged by commit SHA; migrations must complete before service rollout. Deployment credentials and application runtime credentials must remain separate.

Saan currently writes uploads to local filesystem storage. Cloud Run local disk is not a durable upload store. A verified durable object-storage or supported mount solution is still required before claiming upload persistence. Public exposure also requires production-safe authentication/payment behavior; staging test mode must remain private.

- [ ] Record the approved GCP project and region.
- [ ] Provision only the required resources after the team confirms its billing/quota and deployment plan.
- [ ] Add GitHub Environment variables and Secret Manager references without recording values here.
- [ ] Deploy the reviewed `main` SHA and capture workflow, service revision, health and readiness evidence.
- [ ] Verify database and upload persistence after service replacement.

Evidence: deployment run, service revision, smoke-check link and persistence evidence TBD.

## Answer Part 4 - Release, rollback and team participation

Release flow: feature branch to `staging` by reviewed PR; release PR from `staging` to `main`; deploy from the reviewed `main` commit. Rollback must reuse a previously built image SHA and must not assume that reverting an image reverses database migrations.

- [ ] Capture the `staging` to `main` release PR and successful deployment.
- [ ] Perform and document a safe rollback to a previously built SHA, then restore the intended revision.
- [ ] Record the contribution of both teammates across design, implementation, review, deployment and evidence preparation.
- [ ] Verify all links and screenshots, redact credentials/personal data, export one PDF, and submit it to LEB2.

Evidence: release/rollback links and contribution summary TBD.

## Evidence register

| Requirement | Evidence URL or screenshot | Status |
|---|---|---|
| R-01 / R-02 - Docker and environment contract | TBD | Partly prepared; verify against final run |
| R-03 / R-04 - GCP deployment and persistence | TBD | Not deployed; durable upload storage unresolved |
| R-05 - CI build and container build | [Draft PR #23](https://github.com/iceswift/saan_webapp/pull/23); [push run #82](https://github.com/iceswift/saan_webapp/actions/runs/42397846218); [PR run #83](https://github.com/iceswift/saan_webapp/actions/runs/42397852651) | Both passed with the `/data/uploads` Dockerfile setting, production app build, and Docker image build; PR unmerged, image not published |
| R-06 - failing PR merge gate | TBD | Not demonstrated |
| R-07 to R-10 - release, deploy and rollback | TBD | Not configured or demonstrated |
| R-11 - team PDF and participation evidence | TBD | Draft only |
| R-12 - public repository | [Public repository](https://github.com/iceswift/saan_webapp) | Public visibility verified |

## Submission checklist

- [ ] Confirm section and group for the required filename `lab5_sec<section>_<group>.pdf`.
- [ ] Replace every TBD with a real source link or labeled screenshot.
- [ ] Check that evidence is from the team's own repository and GCP project.
- [ ] Remove secrets, tokens, private URLs, personal data and unverified claims.
- [ ] Export one PDF per team, inspect every rendered page, then submit it on LEB2.

