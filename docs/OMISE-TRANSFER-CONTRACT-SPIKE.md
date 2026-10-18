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
