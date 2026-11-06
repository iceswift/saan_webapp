# Verification addendum recorded before new regression tests

Date: 5 November 2026. Existing application baseline: 849294959eeadd6ef88a8c8110c1ba3674b57925.

These tests extend assessment coverage of existing behavior. They do not claim a new domain implementation, historical TDD sequence, HTTP/session proof or teammate authorship.

## Chosen account policy

Any authenticated account may act as a buyer for its own order. A provider account does not need a second customer account to purchase. Shop-management operations still require the owning verified provider. Administrative access to private orders is explicit. This describes existing behavior and resolves the first report's open role-policy question without adding an unimplemented customer-only rule.

## New planned query and database checks

- CQ-01 / AC-04: catalog list and detail exclude inactive items and unverified shops, and become unavailable after verification is removed.
- CQ-02 / AC-04: area, price ceiling and search filtering do not reintroduce ineligible items; detail lists active same-shop packages only.
- CQ-03 / AC-05: retrieve a nested persisted order with price snapshots unchanged after catalog price edits; own-order listing includes it and another customer's listing does not.
- CQ-04 / AC-07: unrelated customer and unrelated provider receive null for a private order; owner, assigned provider and explicit admin receive the permitted projection; nonexistent IDs return null.

Use the existing isolated integration runner only. Assert that DATABASE_URL is money-test.db or the dedicated PostgreSQL saan_test database before writing. Generate unique synthetic fixtures and remove them on test completion. These checks exercise actual queries and persistence, not hand-built DTOs.

## Team allocation

Suwiwat Sinsomboon owns implementation, integration and technical fixes. Supanut Sopha owns requirements review, test design, manual execution, defect reporting and substantive peer review. AI prepares materials and may generate code; the report must not credit either student with executing or reviewing work unless they actually do it.
