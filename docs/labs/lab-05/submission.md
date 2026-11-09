# Lab 5 team submission - working draft

> Working draft only. Replace remaining placeholders, add verified evidence, and render the final team PDF as `lab5_sec<section>_<group>.pdf`. Do not present this draft as proof of a GCP deployment. PR #23 was approved and merged to `staging`; failing-gate PR #24 was closed without merging; release PR #25 needs refreshed review after the documentation update.

## Team

- Repository: [iceswift/saan_webapp](https://github.com/iceswift/saan_webapp)
- Section: TBD
- Group: TBD
- Members: verify course-required names for both teammates
- Due date shown in LEB2: 15 November 2026, 23:59

## Part 0 - Application

Saan is a Thai-language marketplace for spirit-house services. Its deployment profile uses Next.js, TypeScript, Docker and PostgreSQL. The production image is built as a non-root container.

Evidence: [public repository](https://github.com/iceswift/saan_webapp).

## Part 1 - Docker

- [x] Adapt the existing Docker build to Saan.
- [x] Add a CI image build that does not publish the image.
- [x] Build the production image in CI; the reviewed PR checks passed.
- [x] Smoke-test the local production container against disposable PostgreSQL 16: all 8 migrations applied, the app ran as `uid=1000(node)`, uploads used `/data/uploads`, and `/api/health` returned `{"status":"ok"}`.
- [ ] Add the final image build link for the release commit.

The local smoke-test image was not published. Its temporary database, app container, network and image were removed after verification.

## Part 2 - CI and pull-request workflow

The repository uses protected release branches and required CI checks for types/lint/integration, PostgreSQL migration constraints, and the Docker production image.

- [x] Merge reviewed PR #23 into `staging`.
- [x] Pass the three required checks on the feature PR and the initial release PR.
- [x] Demonstrate the failing-check gate with temporary PR #24. GitHub showed “Merging is blocked”; the PR was closed without merging.
- [ ] Refresh the review of release PR #25 after the public-safe documentation update.
- [ ] Merge the reviewed release PR into `main`.

Evidence: [PR #23](https://github.com/iceswift/saan_webapp/pull/23), [PR #24](https://github.com/iceswift/saan_webapp/pull/24), [PR #25](https://github.com/iceswift/saan_webapp/pull/25).

## Part 3 - GCP deployment and data persistence

The planned course deployment uses Cloud Run, Cloud SQL for PostgreSQL, an image registry and managed cloud configuration. Saan uploads files to its container filesystem today; a durable storage solution and replacement test are required before claiming persistence.

- [ ] Confirm the team GCP project, region, quota and budget.
- [ ] Provision and configure the approved cloud resources.
- [ ] Deploy the reviewed release and run migrations before rollout.
- [ ] Verify health/readiness and database connectivity.
- [ ] Verify uploaded-file bytes survive an instance replacement.

No GCP resource or service has been provisioned or deployed.

## Part 4 - Release, rollback and contribution

- [x] Open release PR #25 from `staging` to `main`; its required checks passed and the initial review approved the release contents.
- [ ] Refresh formal approval after the documentation-only update and merge the final release.
- [ ] Demonstrate rollback to a previously built image, check database compatibility, and restore the intended release.
- [ ] Record each teammate's actual work across implementation, review, deployment and evidence collection.
- [ ] Verify evidence, render one PDF, inspect it, and submit it on LEB2.

## Evidence register

| Requirement | Evidence | Status |
|---|---|---|
| Docker build and runtime | [PR #23](https://github.com/iceswift/saan_webapp/pull/23); local smoke-test result recorded in the Lab 5 checklist | CI build and local runtime smoke passed; image not published |
| CI and review gate | [PR #23](https://github.com/iceswift/saan_webapp/pull/23); [failing PR #24](https://github.com/iceswift/saan_webapp/pull/24) | Passing reviewed PR and blocked failing PR verified |
| Release flow | [PR #25](https://github.com/iceswift/saan_webapp/pull/25) | Checks passed; refreshed review pending |
| GCP deployment/persistence/rollback | TBD | Not deployed or verified |
| Final team PDF | TBD | Working draft |

## Final submission checklist

- [ ] Confirm section, group and course-required names.
- [ ] Replace every remaining TBD with verified evidence.
- [ ] Ensure evidence contains no credentials or personal data.
- [ ] Export one PDF per team, inspect every page, and use the required filename.
- [ ] Submit on LEB2 and verify the uploaded file.
