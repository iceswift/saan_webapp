# Catalogue and product detail design pass

20 October 2026, source `e0dc934`.

- Browse supports a custom positive whole-baht maximum budget, in both the desktop sidebar and the phone filter sheet. Blank removes only the budget. Other normalized filters remain in the URL. Invalid input shows a Thai inline error and focuses the field.
- Active filter removal chips now appear on all screen sizes, with at least 44px targets. Empty results explain that individual filters can be removed. Listed prices explicitly exclude optional ceremonies/services.
- Browse product links carry a local `from` destination. Product detail returns to that search, and changing installation area retains the return destination. The `browseReturn` helper accepts only `/browse` and its allowlisted query keys; external/deceptive destinations are rejected. Checkout still receives only the existing booking parameters.
- Product detail adds anchor navigation to available information, supplements and reviews, plus a price checklist: base shrine price, optional services, and dimensions/materials/inclusions/transport costs to confirm with the shop. These are not fabricated specifications or a quote for extra services.
- Shared cards, image rail, real-photo precedence, illustration labels, provider verification, payment behavior and price tokens are retained. No extra product photographs, new packages or paid assets were added.

Validation: TypeScript, targeted ESLint and two return-destination tests. Actual image rollout and browser evidence are recorded in DEPLOYMENT-STATUS.md.
