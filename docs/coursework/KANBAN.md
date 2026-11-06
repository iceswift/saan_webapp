# Saan Sprint 1 Kanban

Updated: 6 November 2026. Scope: CPE 334 Deliverable 1 remaining work.

[GitHub Project](https://github.com/users/iceswift/projects/3) · [Repository](https://github.com/iceswift/saan_webapp)

## Synchronization status

The private GitHub project and all eight open issues exist. The project has Backlog, Ready, In progress, In review and Done columns. Browser control stopped responding before issues could be added to the project. The assignments and acceptance criteria are saved on the issues; the column allocation below is the initial working Kanban until the GitHub cards are populated. Project access for ikmie and repository linking have not yet been verified. Repository collaborator access does not establish project access.

## Board

| Backlog | Ready | In progress | In review | Done |
|---|---|---|---|---|
| #3 Confirm course scope/reuse | #2 Publish reproducible baseline | — | — | — |
| #7 Stale/duplicate submission | #4 Requirements review | | | |
| #9 Final release evidence | #5 Browser journey verification | | | |
| | #6 Impossible appointment dates | | | |
| | #8 Independent build/test review | | | |

Ready means sufficiently defined to pick up; dependencies in each issue still apply. In particular, teammate execution needs the reproducible source baseline first. No task is currently claimed as started, reviewed or done.

## Work items

| Issue | Owner | Initial status | Priority |
|---|---|---|---|
| [#2 Publish reproducible coursework baseline for teammate review](https://github.com/iceswift/saan_webapp/issues/2) | @iceswift | Ready | P0 |
| [#3 Confirm assigned theme and existing-project reuse conditions](https://github.com/iceswift/saan_webapp/issues/3) | @iceswift | Backlog | P0 |
| [#4 Independently review requirements and traceability](https://github.com/iceswift/saan_webapp/issues/4) | @ikmie | Ready | P1 |
| [#5 Execute normal and negative browser journeys with evidence](https://github.com/iceswift/saan_webapp/issues/5) | @ikmie | Ready | P0 |
| [#6 Verify and reject impossible preferred appointment dates](https://github.com/iceswift/saan_webapp/issues/6) | @iceswift | Ready | P1 |
| [#7 Verify stale eligibility and duplicate order-submission boundaries](https://github.com/iceswift/saan_webapp/issues/7) | @iceswift | Backlog | P1 |
| [#8 Independently review build correction and verification assertions](https://github.com/iceswift/saan_webapp/issues/8) | @ikmie | Ready | P1 |
| [#9 Assemble reviewed release evidence and final submission report](https://github.com/iceswift/saan_webapp/issues/9) | @iceswift | Backlog | P0 |

P0: blocks verification/submission. P1: required quality work.

## Team and flow

- Suwiwat / @iceswift: implementation, reproducibility, integration and report assembly.
- Supanut / @ikmie: independent requirements review, test execution, reproducible defect reports and substantive review. AI assistance must be disclosed; personal execution must be distinguished from generated analysis.
- Start with #2. Then ikmie can perform #4, #5 and #8 locally without Tailscale. Suwiwat can investigate #6 and #7 against that baseline.
- Keep at most one active task per person (two team tasks In progress). Move to In review only when the evidence and reviewable result are linked. If blocked, record the reason and dependency on the issue; do not move it to Done.
- Update this file and the GitHub status together after project population. GitHub issues hold detailed acceptance criteria and discussion.

## Definition of Done

Every acceptance criterion in the issue is satisfied or an explicit scope decision is recorded. Link the source revision, relevant test evidence and actual review findings. For a code correction, include an appropriate regression check, real review and any required retest. A reviewer must actually inspect the result; an AI response is not a teammate approval. Final report acceptance also requires both students' confirmation and disclosure of remaining limits.

Existing product code and earlier agent-run evidence are historical baseline, not retrospective Sprint 1 reviews or newly completed cards. Do not backdate activity or fabricate PRs, approvals, manual runs or course permission.

## Finish GitHub setup

1. Add issues #2–#9 to project #3 using their links above.
2. Apply the initial statuses in the table; retain empty In progress, In review and Done.
3. Link the repository and verify ikmie's project access without making the project public.
4. Optionally rename the Backlog view to Sprint 1 Kanban, apply priorities and capture the actual populated board for course evidence.

