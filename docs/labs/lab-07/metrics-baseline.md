# Lab 7 metrics — preparatory snapshot

Repository: iceswift/saan_webapp. Snapshot: 27 November 2026, 17:05 ICT. Activity window starts at 00:00 ICT on 13 November. Re-run at the submission cutoff and use the actual candidate SHA for release test results.

| ID | Definition and scope | Observed value | Evidence |
| --- | --- | --- | --- |
| C01 | Repository Issues closed with state reason completed during the activity window. Exclude PRs and not-planned closures. | 5 | #18, #19, #20 and #21 closed 13 Nov ICT. #22 closed 15 Nov ICT. All five cover Lab 5. |
| C02 | PRs merged to any target branch in this repository during the activity window. Use mergedAt. | 0 | GitHub merged-PR listing filtered by mergedAt. No matching IDs. |
| C03 | GitHub Actions runs created on any branch during the activity window, classified by conclusion. | 0 total | GitHub Actions runs API returned total_count=0. |
| C04 | SQLite integration suite at observed main SHA f1aa542, CI run 43244290218 on 12 Nov. | 69 pass, 0 fail, 0 skip | npm run test:integration; Types, lint and integration tests job. Historical baseline reference. Candidate results pending. |
| C05 | Issues labeled lab6 in the repository, restricted to confirmed Saan defects, at snapshot time. | 0 labeled confirmed Saan defects. Coverage limited to the label query. | The three returned Issues (#36, #37, #38) are open UAT coordination tasks. The Lab 6 report separately records five Quevo PASS cases on the declared Saan baseline. Formal acceptance and controlled-exercise disposition require their own evidence. |

## Reproduction

- C01: gh api 'repos/iceswift/saan_webapp/issues?state=closed&since=2026-11-12T17:00:00Z&per_page=100'. Filter on closed_at, state_reason and pull_request presence.
- C02: gh pr list --state merged -L 100 --json number,mergedAt,baseRefName. Filter on mergedAt in the window. Expand pagination if the oldest returned row is inside the window.
- C03: gh api 'repos/iceswift/saan_webapp/actions/runs?created=%3E%3D2026-11-12T17%3A00%3A00Z'. Record the IDs, workflows, branches and outcomes in any nonempty submission snapshot.
- C04: gh run view 43244290218 --log. Use the named suite's TAP totals and preserve the run and source SHA.
- C05: gh issue list --state all --label lab6 --json number,title,state. Cross-check against the Lab 6 report and defect register before making any broader defect claim.

Draft interpretation (45 words): No new CI runs were recorded in the observation window, so the older green result does not verify the upcoming maintenance change. Suwiwat will attach the named red, green and regression outputs and confirm that the release workflow ran on the exact submitted main SHA.
