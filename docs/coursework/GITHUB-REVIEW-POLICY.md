# GitHub review and merge policy

Verified on 7 November 2026 through the GitHub settings UI and read-only ruleset API.

Repository: https://github.com/iceswift/saan_webapp (private).

## Enforced rules

- [Review gate](https://github.com/iceswift/saan_webapp/settings/rules/26712642): active, targets the default branch (currently `main`). Requires a pull request, one approving review, dismissal of stale approvals on new commits, and resolution of review conversations. Blocks deletion and force pushes. The individual iceswift account has a pull-request-only exception, confirmed by the owner on 7 November 2026; it permits owner merges without a second approving reviewer.
- [Owner merge gate](https://github.com/iceswift/saan_webapp/settings/rules/26712737): active, targets the default branch. Restricts updates, deletion and force pushes. The only bypass actor is the individual `iceswift` account (user ID 159708334), for pull requests only. No broad admin-role, app, deploy-key or collaborator exception was added. The same individual has a PR-only exception in the review gate; no collaborator receives it.
- `ikmie` retains `write` permission, as verified through the collaborator-permission API. Branch work and PRs remain available; direct updates to `main` and independent merges are blocked by the rules above.

## Team workflow

1. Create a task branch and make the change there.
2. Open a PR with its issue, relevant contract and actual verification evidence.
3. For an ikmie-authored PR, request Suwiwat (`iceswift`) to review and approve. A PR author cannot approve their own PR; with this two-person team the owner supplies the independent approval.
4. New commits invalidate prior approvals. Resolve review discussions and obtain fresh approval before merging.
5. Only `iceswift` performs the merge. The owner may use the PR-only exceptions after inspecting the change, without waiting for another reviewer.
6. An iceswift-authored PR may be merged by the owner without peer approval. Where coursework specifically requires substantive teammate review, obtain and record that real review separately; an owner bypass is not evidence of peer approval.

The review gate requires one eligible reviewer, not a named CODEOWNER. If more collaborators are added later, revisit named-review requirements so the policy continues to guarantee the intended reviewer. The owner merge gate continues to reserve merging to iceswift.

Both rules follow the default branch rather than a literal name. Revisit them before changing the repository's default branch. No commits, merges, test pushes or deployment changes were made to test rejection; verification inspected saved active settings and API definitions. No required CI checks were added in this settings task.

