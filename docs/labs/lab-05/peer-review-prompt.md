# Lab 5 teammate review prompt

Copy this prompt to Gemini 3.8 Flash after opening the Lab 5 feature PR. Ask the teammate to inspect the PR, run no commands that change GCP/GitHub state, and post their own review in GitHub. The AI review is a helper; it does not replace the teammate's review or approval.

```text
You are helping our team review a narrowly scoped Lab 5 CI/CD change in the public repository iceswift/saan_webapp. Review the open PR diff only. Do not edit files, push commits, merge, change GitHub settings, provision GCP resources, create credentials, or enable public test login/payments.

Check these points:
1. Does the reusable CI + Cloud Run release workflow actually gate deployment on CI for a push to main?
2. Is the sequence safe: enforced immutable SHA tags, reusing an existing SHA image on workflow reruns, digest deployment, migration before app traffic, a tagged no-traffic candidate with its tagged URL read from service traffic status, traffic promotion, and recovery of the prior revision if the final smoke fails?
3. Can manual rollback accidentally use an unverified image or skip schema-compatibility confirmation?
4. Do the bash/Python scripts handle missing configuration, HTTP failures, split traffic, and a service whose current traffic points to latestRevision?
5. Do the docs distinguish planned configuration from verified deployment, avoid secrets/account-specific billing data, list all required runtime variable names, and match the official Lab 5 Part 0–4 submission headings?
6. Identify anything that could publicly expose test OTPs, synthetic accounts, mock payment actions, personal data, or credentials.

Return only actionable findings, highest severity first, with file and line references. If you find none, say "No actionable findings" and list any Lab acceptance items that remain unverified. Do not approve the PR for me; I will read the findings and submit my own GitHub review.
```

Record the actual date, Gemini model label shown in the interface, result summary and the teammate's own review link in the team PDF. Do not claim the AI or teammate approved anything until it is visible in the PR timeline.
