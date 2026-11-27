# Supanut handoff — Lab 7

## Work Supanut can do now

1. Read the [draft contract](contract-draft.md) and [Issue #39](https://github.com/iceswift/saan_webapp/issues/39). Check the meaning of D+2, whether every date must pass, and the expected outcome when a page stays open across midnight. Compare the old rule with the pinned source.
2. Prepare review feedback in your own words. Reference the exact section, describe the risk, and propose a wording or test correction. After the instructor or TA approves the rule, review the versioned contract as Supanut on GitHub and record the reviewed SHA and verdict. This is the substantive review credited in Part A.
3. Reconcile the five Quevo PASS cases with the original execution evidence. Record case IDs, tester, tested version and available dates. Keep Sprint 1 formal acceptance pending until its own evidence is available.

## After approval and contract review

- Own the red/green evidence in [#40](https://github.com/iceswift/saan_webapp/issues/40). Use an isolated test database and a fixed clock. Review Suwiwat's implementation and verify the exact acceptance case that used to fail. Save the command, SHA and results.
- Independently rerun the assigned post-deployment check in [#41](https://github.com/iceswift/saan_webapp/issues/41). Record initial conditions, synthetic role, timestamp ICT, expected and actual result, revision, and a readable screenshot or log excerpt with no cursor or secrets.
- Lead the metrics reconciliation for [#42](https://github.com/iceswift/saan_webapp/issues/42). We will each verify our own contribution and review the other's evidence.

## Copyable AI prompt

> Help me (Supanut, ikmie) review CPE334 Lab 7 for Saan (iceswift/saan_webapp). Read Issue #39, docs/labs/lab-07/contract-draft.md, the Sprint 1 date contract and the checked main source. Audit the proposed D+2 Bangkok calendar-day rule against checkout, the server action, persistence, roles and existing order flow. Return an English review draft with the source SHA, precise findings, proposed checks and unresolved evidence. Verify whether the existing suite exercises the real server action and suggest a deterministic red fixture that would have been accepted under the old rule. Keep the approval and formal Sprint 1 acceptance marked pending unless I provide primary evidence. Draft only until approval and contract review. Never submit a review in my name or infer that an unexecuted test passed. Use synthetic data and omit secrets. I will inspect the output, run the checks and write the final GitHub review myself.
