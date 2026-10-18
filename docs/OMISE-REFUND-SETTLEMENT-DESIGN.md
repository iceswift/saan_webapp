# Omise refund and shop-settlement decision brief

Researched 18 October 2026. Engineering decision record, not an account-specific approval or legal opinion. Current staging image remains `saan:refund-a7c7fa12ae14`; this document does not activate financial operations.

## What the official sources establish

| Topic | Evidence | Consequence for Saan |
|---|---|---|
| PromptPay API refund | [Method guide](https://docs.omise.co/promptpay): no void/refund through Omise. The actual THB 30 test receipt also returned refundable=false. | Keep Omise REFUND execution disabled. A bank transfer is not a successful Omise Refund object. |
| Alternative refund route | [Public payment-channel terms](https://cdn.omise.co/assets/screenshots/Website%20-%20terms%20and%20conditions/T%26C%20Payment%20Channels.pdf), PDF page 4, clause 8: the general alternative-refund prohibition has method exceptions; the PromptPay row assigns direct alternative reimbursement to the merchant. The issuing-bank instruction belongs to the following Citi Points row. | There is evidence for an external refund workflow; do not state that all reimbursement is forbidden. Confirm the applicable account terms and practical evidence requirements. |
| Version uncertainty | [Current Thailand terms landing page](https://docs.omise.co/terms/thailand) links `Omise-T&C-Thailand-ver-20250930.pdf`; retrieval returned HTTP 403 during this research. The readable channel PDF above must not be represented as the account's current executed terms. | Ask for the applicable version and confirmation of the PromptPay exception. Current contract applicability is unresolved. |
| Third-party transfers | [Transfer guide](https://docs.omise.co/transferring-funds/thailand): recipients need both verification and activation; transfers use available account balance. | A technical shop-payout path exists. Account/business approval and destination verification remain necessary. |
| Marketplace arrangement | [Current public MSA](https://cdn.omise.co/assets/screenshots/Legal%20Documents/Omise-MSA-Thailand-Organic-ver-20251010.pdf), clause 3.2, distinguishes the merchant's services from third-party services unless expressly permitted. | Obtain confirmation of the actual marketplace arrangement; recipient API availability alone does not establish approval. |
| Transfer completion and amount | [Transfer API](https://docs.omise.co/transfers-api/thailand) distinguishes sent from paid and defines net as amount minus total_fee (fee plus fee_vat). It exposes idemp_key, whose behavior is still untested on our account. | Reconcile paid evidence, not POST success or sent=true. Preserve requested amount, costs and received net separately. No automatic retry until duplicate/lost-response behavior is proven. |
| Published fees | [Current pricing](https://omise.co/th/pricing/thailand): PromptPay 1.65%; transfer up to THB 2m THB 20, above THB 2m THB 150. The readable older channel schedule instead lists THB 30 for the lower transfer tier. | Do not hardcode either transfer rate as the account contract. Confirm VAT, applicable tier and whether the shop's net or gross amount is the contractual target. |

Provider holding periods and Saan's order acceptance are separate conditions. No source here establishes order-specific escrow or a guaranteed maximum holding period for Saan. No Saan commission rate is approved by this research.

## Implementation decision: external refund case, separate from payment gateway

Proposed next implementation, not yet deployed:

1. Preserve existing cancellation and REFUND/ACTION_REQUIRED obligation. Add a separate refund-case and append-only case-event model, rather than pretending an external reimbursement came from the Omise adapter.
2. Suggested case lifecycle: NEEDS_CUSTOMER_DETAILS → DETAILS_VERIFIED → APPROVED → SENT_UNVERIFIED → COMPLETED; BLOCKED for exceptions. These are case states, not gateway money-operation results. Record actor, timestamp, reason and version on every transition.
3. A customer supplies destination details through an authenticated private form tied to their original payment. Store only necessary encrypted details, masked display values and limited-access evidence. Do not put account numbers in notifications, URLs, ordinary logs or this document. Decide retention before collecting real bank data.
4. Lock an immutable destination/version and amount at approval. A changed destination invalidates approval. Keep original paid charge identity and a unique case per payment/obligation. Reserve the outstanding entitlement before any execution; concurrent reviewers cannot allocate the same money twice.
5. Initially, transfer is performed outside Saan by an authorized human after checking the original payer and destination. A screenshot or an administrator's success click alone does not prove receipt. Capture the real banking reference and independently checked statement/transaction evidence; keep SENT_UNVERIFIED if outcome is uncertain. Do not create a second transfer to resolve uncertainty.
6. Only verified completed evidence changes the financial projection. Full external reimbursement may close the obligation with an explicit external rail, but must never invent an Omise refund reference. Partial refunds need amount-based ledger entries; the current all-or-nothing Payment.status is insufficient and must be extended before partial external reimbursement is enabled.
7. Customer wording: awaiting details / checking / sent and awaiting verification / returned with date and amount. No guaranteed timing before the operational policy is agreed. Provider fees are not automatically customer deductions; full entitlement and fee allocation are separate product/accounting decisions.
8. Prefer distinct preparer/reviewer accounts for real funds. A single-operator business needs an explicit alternative review policy; do not fabricate a second approval or quietly relax it in code. Sandbox can exercise the proposed transitions without real bank data or movement.

Keep this behind separate workflow/configuration gates. Do not change current historical PAID payments or ACTION_REQUIRED rows while designing it.

## Shop settlement contract

- Recipient is a verified, active shop destination with a version locked into each settlement. Account change pauses unpaid settlements until review.
- Snapshot gross sale, confirmed refunds, agreed commission, processing costs/VAT, transfer costs/VAT and promised bank net in integer satang. Policy must have a version; unknown commission is not zero by default.
- Eligibility: completed/accepted work, exact verified receipts, no unresolved refund/dispute/overpayment, provider availability and enough unreserved funds. Outstanding customer refunds take priority over allocating the same funds to shops.
- An outbound attempt records its provider account/mode, immutable amount/destination and request identity before dispatch. On timeout keep UNKNOWN and recover the original provider object; never issue a replacement blindly.
- Sent and paid are separate. Complete only after verified provider paid evidence matching mode, destination and amounts. Confirm actual net semantics on a synthetic test recipient before wiring payout actions to orders.
- Cost example, not an adopted policy: actual THB 1,000 sandbox collection produced THB 982.34 provider net across the two installments. Thus promising the shop THB 1,000 bank net requires another source to cover collection/transfer costs, or a disclosed agreement allocating them. Do not label gross receipts as spendable shop net.

## Concrete execution order

1. Owner reviews/sends the prepared provider questions; record dated answers and applicable terms without secrets.
2. Implement case schema, evidence access and lifecycle in test mode; verify authorization, atomic transitions, destination changes, partial amounts and duplicate review on PostgreSQL.
3. Run a sandbox recipient/transfer contract spike using fictitious bank data; prove fee/net, sent/paid, idempotency and lost-response recovery. This is separate from using Transfers as a customer-refund rail.
4. Integrate shop payout and external-refund workflows only after their respective gates pass. Keep live activation separate.

Acceptance tests include: wrong customer/shop, changed destination, duplicate approval, two concurrent cases over the same entitlement, total partial refunds exceeding payment, forged/duplicate evidence, sent but unverified, bank outcome unknown, worker restart and refund versus payout allocation races.

See [provider inquiry draft](OMISE-PROVIDER-QUESTIONS-TH.md). No message was sent, no bank destination was created and no live money movement was initiated during this research.

## Implemented sandbox milestone

The synthetic full-amount case lifecycle is now implemented and deployed separately from external money movement. See [REFUND-CASE-SANDBOX.md](REFUND-CASE-SANDBOX.md) and staging QA. Destination/evidence identifiers are synthetic only; completion leaves financial obligations open. Partial refunds, actual bank evidence and live execution remain future work.
