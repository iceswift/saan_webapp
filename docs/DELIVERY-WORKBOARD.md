# Saan launch and inclusive-use workboard

Owner direction (4 November 2026): continue through the remaining work in order; optimize for good use across customer, provider and administrator groups, including elderly users, keyboard users, small/large screens, large text and reduced motion. Do not mark a phase complete on compilation alone.

## Definition of done

A completed change has reviewed Thai copy, meaningful interaction/error/empty/loading states, data ownership checks where applicable, relevant automated checks, browser interaction and screenshots, recorded limitations, a saved Git checkpoint and a verified private-staging release. Historical tests are evidence for their original release, not a current certification. Synthetic test data must remain clearly labeled. Never invent business photos, ratings, hours or promises.

## Ordered work

| Phase | Work | State / next evidence |
|---|---|---|
| 1 | Close the full-screen map release | Closed engineering follow-up 4 Nov on inclusive-8a648f0f7b38; desktop/portrait/landscape geometry, keyboard filters, selection, large text and dark inspected. Physical devices/large datasets remain pilot checks. |
| 2 | Inclusive end-to-end customer/provider/admin review | First pass shipped: Thai phone/OTP/prices, resend, safe returns, filter recovery; automated and browser evidence in INCLUSIVE-QA-2026-11-04.md. Full assistive-technology/real-participant matrix remains open. |
| 3 | Real-provider readiness | Public photo and contact availability shipped and restore-tested 4 Nov; sample hours removed. Owner-scoped registration/edit and verified-only directory remain. Real shop details and approved payout-recipient onboarding remain open; team sharing stays deferred. See PROVIDER-PUBLIC-PROFILE.md. |
| 4 | Live collection, settlement and refunds | Sandbox foundation exists. Need Omise's account-specific approval/contract, refund route, fees/holding terms, merchant/business/accounting decisions. Keep live gates closed. Prepare concrete configuration/runbooks before activation. |
| 5 | Public operations | Next/Zod patched; dev tools pruned; current home-only backup and isolated restore verified. Prisma CLI advisories remain documented. Real SMS/authentication, public domain/ingress, external alert delivery and off-machine destination remain open. No public exposure or new external data recipient without the necessary owner choice/authorization. |
| 6 | Small real-user pilot | Prepare task scripts, feedback/defect process, success/stop criteria and a limited rollout. Recruiting/real transactions require real participants and approved live setup. |

## Deferred optional features

Swipe browsing, shared provider teams, vow export as an image, recurring care reminders and other "coming soon" features must not distract from complete core flows. Remove misleading promises; do not silently present sample values as real data.

## External decisions that engineering cannot invent

- Approved Omise account arrangement and PromptPay refund/recipient terms; merchant identity and actual commercial split.
- Business/tax/document obligations confirmed for the owner's actual operating model.
- SMS account/provider and credentials, public domain, actual support recipient/channel and alert destination.
- Off-machine backup destination: the owner's existing instruction forbids copying backups off the home server until separately authorized.
- Real provider imagery/details and real pilot participants.

Continue independent code, private tests and documentation while those decisions are outstanding. Do not contact third parties or accept contracts on the owner's behalf without explicit authorization.

## Evidence locations

Current releases: DEPLOYMENT-STATUS.md. Operational boundaries: OPERATIONS.md. Map design: SHOP-MAP-DESIGN.md. Existing payment account questions: OMISE-PROVIDER-QUESTIONS-TH.md. Add dated audit evidence rather than overwriting history.

Public SMS/authentication preparation and acceptance gates: PRODUCTION-AUTH-READINESS.md. Owner service/domain/support information was requested 4 Nov; no answer or credentials should be inferred from elapsed time.
