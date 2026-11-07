# Saan Sprint 1 Kanban

Updated: 7 November 2026. Scope: CPE 334 Deliverable 1 remaining work.

[GitHub Project](https://github.com/users/iceswift/projects/3) · [Repository](https://github.com/iceswift/saan_webapp)

## Synchronization status

The private GitHub project now contains all eight issues. The repository Projects page lists it, the default repository is saan_webapp, and the active board view is Sprint 1 Kanban. Manage access shows iceswift as Admin and ikmie as Write (two members). Repository merge permissions are unchanged by project access.

The template initially moved the three already-closed teammate issues to Done. The Item closed workflow was disabled and their project statuses manually restored to In review pending the referenced artifacts. Their issue states remain closed, preserving the teammate's actions. Do not equate a closed issue with inspected evidence. Priority values below are planning priorities; the GitHub Priority fields have not been populated.

## Board

| Backlog | Ready | In progress | In review | Done |
|---|---|---|---|---|
| #3 Confirm course scope/reuse | — | #9 Final report acceptance | #2 Published baseline | — |
| | | | #4 Requirements artifacts | |
| | | | #5 Browser artifacts | |
| | | | #6 Integrated date correction | |
| | | | #7 Verified submission semantics | |
| | | | #8 Build/test review artifacts | |

Publication and code correction are integrated through PRs 10–12. In review retains the distinction between owner integration and course-required peer review/artifact inspection. Done is empty; final release acceptance is not claimed. Six review items exceed the template's advisory review limit of five; these are queued acceptance/evidence checks rather than six simultaneous active implementation tasks.

## Work items

| Issue | Owner | Current project status | Priority |
|---|---|---|---|
| [#2 Publish reproducible coursework baseline for teammate review](https://github.com/iceswift/saan_webapp/issues/2) | @iceswift | In review | P0 |
| [#3 Confirm assigned theme and existing-project reuse conditions](https://github.com/iceswift/saan_webapp/issues/3) | @iceswift | Backlog | P0 |
| [#4 Independently review requirements and traceability](https://github.com/iceswift/saan_webapp/issues/4) | @ikmie | In review | P1 |
| [#5 Execute normal and negative browser journeys with evidence](https://github.com/iceswift/saan_webapp/issues/5) | @ikmie | In review | P0 |
| [#6 Verify and reject impossible preferred appointment dates](https://github.com/iceswift/saan_webapp/issues/6) | @iceswift | In review | P1 |
| [#7 Verify stale eligibility and duplicate order-submission boundaries](https://github.com/iceswift/saan_webapp/issues/7) | @iceswift | In review | P1 |
| [#8 Independently review build correction and verification assertions](https://github.com/iceswift/saan_webapp/issues/8) | @ikmie | In review | P1 |
| [#9 Assemble reviewed release evidence and final submission report](https://github.com/iceswift/saan_webapp/issues/9) | @iceswift | In progress | P0 |

P0: blocks verification/submission. P1: required quality work.

## Team and flow

- Suwiwat / @iceswift: implementation, reproducibility, integration and report assembly.
- Supanut / @ikmie: independent requirements review, test execution, reproducible defect reports and substantive review. AI assistance must be disclosed; personal execution must be distinguished from generated analysis.
- Source publication and boundary verification are integrated. PR #14 supplied the teammate artifacts and the 34-page report incorporates them. Remaining acceptance checks are listed in RELEASE-STATUS.md.
- Keep at most one active task per person (two team tasks In progress). Move to In review only when the evidence and reviewable result are linked. If blocked, record the reason and dependency on the issue; do not move it to Done.
- Update this file and the GitHub status together after project population. GitHub issues hold detailed acceptance criteria and discussion.

## Definition of Done

Every acceptance criterion in the issue is satisfied or an explicit scope decision is recorded. Link the source revision, relevant test evidence and actual review findings. For a code correction, include an appropriate regression check, real review and any required retest. A reviewer must actually inspect the result; an AI response is not a teammate approval. Final report acceptance also requires both students' confirmation and disclosure of remaining limits.

Existing product code and earlier agent-run evidence are historical baseline, not retrospective Sprint 1 reviews or newly completed cards. Do not backdate activity or fabricate PRs, approvals, manual runs or course permission.

## Verified GitHub setup

All eight cards, owner assignments, repository link, private visibility and project write access for ikmie were observed in the browser. Current status is Backlog 1, In progress 1, In review 6, Done 0. A screenshot is retained at output/coursework/kanban-sprint-1.png; it is current working evidence, not a final accepted release snapshot. See RELEASE-STATUS.md for application verification and report readiness.
