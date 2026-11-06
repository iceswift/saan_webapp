# Build stylesheet contract

Recorded 5 November 2026 before the corrective configuration change.

## BLD 01 Intended behavior

The documented local Webpack build must emit compiled Tailwind utilities and render the same shared layout primitives as the existing Turbopack build. A successful JavaScript compilation with unprocessed Tailwind directives does not meet this requirement.

## Observed failure before correction

The direct Webpack command completed, but the browser rendered oversized unbounded brand SVGs and unstyled controls. Diagnostic screenshots are retained under output/coursework/demo-*.png. They are failure evidence, not accepted product screenshots. The existing next.config.ts invokes the Tailwind compiler only through turbopack.rules.

## Acceptance and planned checks

- BLD-AC-01: generated application CSS has no uncompiled Tailwind @theme/@utility directives and contains the flex layout utility required by shared UI.
- BLD-AC-02: actual browser login and order layouts have bounded brand/control geometry and readable content after the corrected build.
- BLD-AC-03: session and order HTTP verification plus integration tests continue to pass; no business schema or money policy change.

Use the existing @tailwindcss/turbopack package, whose implementation is a standard webpack-compatible loader, as a CSS pre-loader in the Webpack pipeline. Preserve the current Turbopack rule. No new dependency, shared UI edit, live integration or home-server deployment is required.

Record the real failing CSS check before changing config and the passing run afterward. This is a narrow prospective correction with a genuine red/green sequence; it does not retroactively establish TDD for the older application. Human teammate review remains outstanding.

## Revision 2 after the first correction attempt

Adding a custom Webpack CSS rule disabled Next.js's built-in CSS handling. The attempt failed compilation and is retained as build-corrected-webpack-2026-11-05.txt. It was not accepted. Revised design follows the installed Next.js CSS guide: the official @tailwindcss/postcss 4.3.3 adapter and a shared postcss.config.mjs replace the bundler-specific compiler rule. This adds one direct development dependency matching the existing compiler version; preserve native Next.js CSS handling for both bundlers. Acceptance criteria remain unchanged.
