# Small-user pilot playbook

Prepared 4 November 2026. This is a plan, not evidence that a real-user pilot has occurred. Use private staging and synthetic orders until live gates are approved.

## Participants and setup

Recruit customers with different Thai reading confidence and digital experience, including elderly users; providers who actually manage appointments; and the person who will operate support/finance. Include keyboard-only and large-text use. Ask permission to observe; do not collect identity documents, banking credentials or private addresses for a usability session. Let participants use their own device where possible. Do not record screens containing personal data without consent.

## Tasks (give the goal, not click-by-click instructions)

| Group | Task | Observe |
|---|---|---|
| Customer | Find a suitable shrine within an area/budget, compare details and return to results | Finds filters; understands price/service area; retained search; no accidental navigation |
| Customer | Find a shop on the map, inspect its address and get back | Distinguishes approximate pin from exact address, service area and illustrative photo; usable list alternative |
| Customer | Sign in, recover from a wrong code, request another code | Understands phone/OTP steps; focus and error recovery; no need to restart |
| Customer | Start a synthetic booking, choose a Thai date, review costs | Understands deposit/balance and test mode; required-field errors identify the field |
| Customer | Find an existing order's next action, cancellation/refund status and support | Does not infer that test money moved; finds a single clear next action |
| Customer | Add a private vow/reminder and locate it again | Understands private location versus public shop pin; can edit/return without losing work |
| Provider | Complete public profile, areas and map pin | Understands exactly what becomes public; no real personal address needed for testing |
| Provider | Enter a product price, respond to a request and find schedule | Price formatting is clear; errors recover; knows what customer sees |
| Provider | Find settlement history and explain whether a transfer is complete | Distinguishes journal state, test transfer and real bank settlement |
| Admin | Review a provider and inspect a synthetic payment/refund exception | Can locate evidence and understand irreversible boundaries without executing real actions |

Use sandbox fixtures rather than asking participants to pay or scan QR codes. Omise test outcome changes are operator tasks. For each core task record unassisted completion, assistance, time to first useful action, wrong turns, unclear Thai wording and a short participant comment. Avoid treating speed alone as success.

## Release criteria

- No unresolved blocker for booking, order recovery, provider response or admin exception handling.
- No lost/duplicated order or money operation; unauthorized records remain inaccessible.
- Participants can explain what is public, what is simulated and what the next action does.
- Critical tasks work on narrow portrait, landscape, desktop, large text and keyboard paths; physical iOS/Android checks are still required even after emulation.
- A named support operator, approved real contact channel, rollback image and verified restore procedure exist before a live pilot.

Stop immediately for a privacy leak, real payment in a supposed test, duplicate settlement, inaccessible core action or misleading payment/refund promise. Preserve redacted evidence, pause the affected capability and fix before resuming.

## Defect record

Record release/image, device/browser, role, task, expected/actual result, reproduction, severity, redacted screenshot, fix owner and retest evidence. Blocker = cannot complete or unsafe; major = assistance/workaround required; minor = understandable friction. Close only after the affected task is repeated, not merely after a code change.
