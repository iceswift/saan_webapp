# Design refresh — first customer pass

Implemented on 20 October 2026. This is a scoped prototype, not a replacement of the v6 design system.

- Home prioritizes customer decisions (accept work, pay deposit), then scheduled work and provider confirmations. It shows up to three jobs and the full active count.
- The vow teaser shows up to two unfinished records belonging to the signed-in user, prioritizing granted wishes and reminder dates. Visitors retain the illustrated introduction. No public vow data is queried.
- Customer order detail groups secondary content into Overview, Messages and Site details tabs. Status, primary payment/acceptance actions and refund-case notices remain outside the tabs.
- Tabs use the existing Base UI package with keyboard navigation. Panels remain mounted so changing tabs preserves message drafts. No third-party component source, paid assets or new packages were added.
- Existing Thai text, token palette, arch identity, reduced-motion settings and payment behavior remain applicable.

Validation: TypeScript, focused agenda tests and ESLint on changed source. Browser and staging rollout must be recorded separately when performed; a source commit alone does not update the home server.

Next design passes: validate this composition at phone and desktop sizes in both themes, then consider form option cards and grouped disclosure patterns. Keep payment actions visible and test message draft preservation when changing tabs.
