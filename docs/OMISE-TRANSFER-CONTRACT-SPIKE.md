# Omise shop transfer contract probe

18 October 2026. This probe is standalone sandbox evidence, not Saan payout integration. Deployed order-payment, refund-case and financial records are unchanged.

## Observed recipient behavior

- Authenticated the protected test account using pinned API version `2019-05-29`; verified account livemode=false without logging credentials or raw account data.
- Created one synthetic recipient `recp_test_69duo9opicxsa4c50q6`, named SAAN SANDBOX SHOP, bank code `test`, fictitious bank identifier. Initial provider response: active=false, verified=false.
- Used the documented test-only verification endpoint, then independently retrieved the original recipient: verified=true, active=false.
- PATCH with active=true did not change active on this account. HTTP success is therefore not proof of activation. The recipient API reference does not list active as an update parameter; the [transfer guide](https://docs.omise.co/transferring-funds/thailand) directs activation through recipient details in the dashboard.
- Browser dashboard reported an expired login session. Owner sign-in is needed before continuing that UI step. No password/OTP requested in chat and no credential change was attempted.

## Probe controls

Ignored local journal: `storage/omise-transfer-spike/saan-shop-20261018.json`. Contains provider account identity for account-match checks, original recipient/transfer identities and sanitized observed fields; no secret key. Each mutation step reserves an exclusive file before dispatch. A reserved or uncertain step is not automatically repeated. Preserve these journals; do not delete them to permit a second request.

The protected local tool uses a fixed HTTPS API origin, test-key and test-object guards, a fixed synthetic destination and a fixed test transfer amount of 10,000 satang. It checks balance and both recipient flags before allowing that transfer. It is not a production gateway or a distributed idempotency implementation. No arbitrary bank details are accepted.

## Remaining evidence

1. Activate this exact test recipient through the dashboard; verify active=true via GET.
2. Create one THB 100 test transfer to this recipient (explicit amount, recipient and request identity). Retrieve the same object and record amount, fee, fee VAT, total fee, net, sent and paid.
3. Exercise documented test sent/paid mechanisms, independently retrieving between stages. Record any differences from the published net contract, never reinterpret contradictory provider fields as success.
4. Provider idempotency duplicate/mismatched amount and lost-POST-response recovery remain unproven. Do not enable automatic retries or order payouts on the basis of this happy-path probe.

No transfer has been created as of this checkpoint. Live transfers, recipient onboarding approval, marketplace terms, commission, fee allocation and fund reservations remain separate gates.

## Completed continuation

After owner sign-in, activated the original synthetic recipient through the dashboard; independent GET confirmed active=true and verified=true. Created exactly one test transfer `trsf_test_69dupqk6smkr1idpp43` to that recipient with explicit amount 10,000 satang, fail_fast=true, idemp_key `saan-shop-20261018` and matching metadata. No order was linked or marked paid out.

Observed the same object through all stages, using independent GET between test actions:

| Stage | sent | paid | sendable |
|---|---|---|---|
| Created | false | false | true |
| Test mark_as_sent | true | false | false |
| Test mark_as_paid | true | true | false |

Fee evidence on this specific sandbox transfer: amount 10,000 satang, fee 1,869, fee_vat 131, total_fee 2,000, net 8,000. Thus this test receipt's total fee is THB 20 including its reported VAT component, and the recipient net is THB 80. Do not treat that as a universal tariff quote or add VAT a second time to this observed total. Original metadata, mode, amount and recipient were validated; net equals amount minus total_fee and total_fee equals fee plus fee_vat.

Dashboard independently displayed PAID, the same transfer identity, requested THB 100, fee THB 20, net THB 80, the synthetic shop and separate created/sent/paid events. Screenshot: ignored local `output/staging/omise-synthetic-transfer-paid.png`. Test balance decreased; no live bank payment occurred.

### Implications

- Recipient verification and activation are separate requirements. API HTTP 200 on an unsupported activation parameter is not enough; inspect actual active state.
- Do not credit a shop with the requested amount when it receives a lower net. Decide who absorbs costs, lock a versioned fee policy and reconcile actual provider net.
- A transfer created or sent is not paid. Use verified provider paid evidence and preserve pending/unknown outcomes.
- This proves only one synthetic happy path. Provider idemp_key duplicate/mismatched-amount behavior, retention/scope, lookup without a transfer ID and lost-POST recovery remain NOT RUN. Current reservation files prevent local redispatch; they do not establish provider idempotency.
- No production app, migration, gateway capability, actual refund or Saan shop-payout ledger was changed for this standalone probe. Order payout remains disabled. Next engineering milestone is a tested provider transfer boundary plus durable attempts/account mapping and fund reservation; it must pass failure/retry checks before registering a payout gateway.

## Duplicate-request contract observed

Further explicit sandbox probes repeated the original POST with the same documented idemp_key, recipient, THB 100 amount, fail_fast flag and metadata. Provider returned HTTP 200 with NEW identity `trsf_test_69durfim1wwnpiqxyw7`. A separate same-key THB 101 request returned another new identity `trsf_test_69durh7l53y0xs7qt5l`. Both are pending/unpaid. Independent GET list returned all three original/duplicate/mismatched-amount records. Therefore this account/API observation does not provide duplicate prevention through idemp_key; neither new record is evidence of an application retry.

The payout implementation consequently uses a durable one-shot dispatch reservation, never repeats POST after uncertainty, and searches metadata/read-only provider objects to recover the original result. Duplicate matching metadata requires manual review. Full implementation/rollout rules: OMISE-PAYOUT-SANDBOX.md.
