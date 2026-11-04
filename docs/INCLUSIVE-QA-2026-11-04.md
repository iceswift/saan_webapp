# Inclusive-use review — 4 November 2026

## Scope and changes

This is engineering QA of private staging, not a study with elderly or disabled participants. Real-device and real-user evidence remains required; see [PILOT-PLAYBOOK.md](PILOT-PLAYBOOK.md).

- Map uses a side panel on tablet and short landscape; phone portrait retains collapsible results. Filters use the shared modal sheet rather than consuming the map/details viewport. Screen readers retain a heading in compact landscape.
- Phone entry accepts Thai digits, common separators and +66 notation. OTP entry accepts Thai digits. Step changes focus the corresponding field; requesting a new code preserves the phone and announces the result. Server limits still apply.
- Provider product/package/quote prices and browse budgets accept Thai digits and correctly grouped thousands. Validation and preview share a parser, so a preview cannot silently use a different amount. Invalid fields stay actionable and receive inline errors.
- Login return destinations are constrained to the same site.

## Automated evidence

- TypeScript and targeted lint passed.
- 30 nonintegration tests passed, including normalization, whole-baht boundaries and malicious return URLs.
- 63 integration tests passed on isolated SQLite `money-test.db`.
- 51 PostgreSQL-compatible integration cases passed on isolated `/saan_test`, plus database uniqueness/deletion/transaction-rollback checks. OTP, provider-order and review suites retain SQLite-only guards and were tested in the SQLite run.
- The first broad PostgreSQL attempt stopped at those three intentional SQLite-only guards (51 passed, 3 file failures). Its assertion displayed a connection URL. The rerun captures/redacts child output and excludes the incompatible files. Credential rotation and deployment verification are recorded in DEPLOYMENT-STATUS.md once complete.

## Browser verification

Verified on `saan:inclusive-8a648f0f7b38` in the in-app browser:

- Actual CSS viewports 1200×750 desktop, 325×703 portrait and 703×325 landscape: document dimensions match the viewport; map starts at (0,0). Phone search/results do not overlap. Landscape uses a 320px side panel with independently scrollable results. Desktop natural pane was later 1544×725. Device-pixel scaling means requested emulation dimensions differ from CSS dimensions; record measured sizes, not requested values.
- Enter opens filters; initial focus is close; Escape returns focus to the trigger. Provider-kind filter updates the result count, zero-state reset restores the shop. Selecting a shop by keyboard focuses its detail heading. AI and approximate-location labels remain visible.
- Large-text mode computes 19px root type. At 325×703 expanded results begin at y≈251.8, search ends at y≈243.9, without overlap/horizontal page overflow. Light and dark map/control themes inspected after tiles loaded. Text size/light appearance and default viewport restored after testing.
- Synthetic provider login accepts Thai phone digits; OTP focuses automatically. An incomplete Thai-digit code produces an inline error and retains focus. Resend clears the stale code, preserves the canonical phone and announces a new test code. Thai-digit OTP then returns to `/provider/products/new`. Synthetic admin +66 notation returns to `/admin/operations`.
- Product preview reads THB 1,500 and deposit THB 450 for `๑,๕๐๐`. `1,5` produces inline price/name/kind errors and focuses the first invalid field; no product is saved. Browse budget `๑,๕๐๐` becomes `max=1500` while preserving `area=BKK`.
- Leaving the map restores ordinary header/footer/navigation. Admin operations displays healthy worker/backup and the existing THB 30 refund obligation honestly as needing action. No payment/transfer/refund mutation was submitted.

Screenshots are ignored local artifacts in `output/staging/inclusive-*`. Viewport overrides occasionally produced scaled/stale captures; the refreshed natural-size desktop screenshot is the main visual proof. Narrow sizes were additionally checked through rendered layout rectangles and keyboard interaction. This is not physical mobile or screen-reader certification.

## Narrow-calendar follow-up

Checkout was reviewed at measured 325×703 CSS pixels without submitting a valid order. Missing date/place type produced inline errors; focus moved to the date field. ArrowRight moved from 5 to 6 November; Enter selected `6 พ.ย. 2569` and returned focus to the trigger. Order count remained four.

This review found day buttons shrinking to ≈38.93×44px because seven columns shared the sheet's padded width. A narrowly scoped global CSS rule now gives only grids containing `.cal-day` a centered 308px minimum footprint on narrow screens, with a physical 44px minimum day width. Shared component files/API are unchanged; text and height still scale in rem. No horizontal page overflow was introduced.

Verified on `saan:calendar-10d6520730ae`: normal text ≈44×44px; 19px root large-text mode ≈44×52.24px; month arrows ≈47.76×52.24px; close ≈52.24px square. Grid bounds x≈2.25–310.25 within the 312px document/325px viewport. Buddhist-year display, keyboard selection and Escape dismissal still work. Screenshot: ignored `output/staging/calendar-large-touch-targets.png`. Normal text/default viewport restored. This is layout/interaction evidence, not a physical-device user study.

## Remaining coverage

Physical iOS/Android, screen-reader testing with actual assistive technology, a larger real provider dataset, map tile outages, and participants with low digital confidence remain outstanding. Browser emulation and code inspection do not prove those experiences. Real providers still need to supply their own photos/contact details and complete approved payout onboarding; the photo/contact fields themselves are now implemented.
