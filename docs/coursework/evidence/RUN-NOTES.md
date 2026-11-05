# Local evidence on 5 November 2026

Application baseline: `849294959eeadd6ef88a8c8110c1ba3674b57925`. Application code and tests were unchanged; only the coursework documents were added. Windows host, PowerShell, Asia/Bangkok.

| Command | Exit | Observed result |
| --- | --- | --- |
| `npm run test:integration` | 0 | 65 tests passed, 0 failed, 0 skipped. Runner forces isolated SQLite money-test.db and mock payments. |
| `npx next typegen` then `npm run typecheck` | 0 | Route generation and TypeScript passed. |
| `npm run build` inside restricted sandbox | 1 | Google Fonts fetch failed, including DM Sans and Prompt. The terminal result was observed, but its original transcript was overwritten by the retry; this note is a run summary, not the original output. |
| `npm run build` outside restricted sandbox | 1 | Turbopack failed while generating the root app endpoint. PostCSS worker process exited before the parent connected. Full retained output: build-2026-11-05.txt. |

No build failure was disabled or reclassified as a pass. No application fix was attempted during the first report pass. The second pass below includes a real stylesheet configuration correction. The successful Linux build in docs/DEPLOYMENT-STATUS.md remains historical and separate.

## Rendering

The documents skill renderer was attempted but could not locate LibreOffice on this Windows runtime. The installed Microsoft Word document engine exported the new DOCX to PDF in a hidden process; bundled Poppler rasterized all 16 pages. Every page was visually inspected; affected pages were inspected again after edits. Final source removes inherited paragraph borders to avoid the Word template's blue title rule.

## Limits

These runs do not establish a final course release, teammate review, TDD sequence, session-backed HTTP coverage, theme approval or application launch readiness. No financial operation, real SMS, external backup transfer or home-server deployment was performed.

## Expanded second pass

The first-pass limitations above describe that earlier state. The second pass adds actual session-backed HTTP coverage and a narrow prospective stylesheet regression, as follows. No human teammate execution/review or course approval is inferred from these checks.

- Source correction and tests: commit `846b532`, after prospective stylesheet contract/check commit `7b8ee93`. Original business baseline `8492949` remains in history. These direct commits are not teammate-reviewed course PRs.
- `npm run test:integration`: 69 passed, 0 failed, 0 skipped, exit 0. Four new query/database cases CQ-01 to CQ-04. Retained final transcript integration-expanded-2026-11-05.txt.
- Route type generation and TypeScript passed; the corrected builds also ran TypeScript successfully. Targeted ESLint final run exited 0 with no warnings. The earlier anonymous-export warning was corrected before the final source build.
- `node node_modules/next/dist/bin/next build --webpack`: final shared PostCSS build passed, exit 0. Transcript build-postcss-webpack-2026-11-05.txt.
- `node node_modules/next/dist/bin/next build`: final default Turbopack build passed, exit 0. Transcript build-postcss-default-2026-11-05.txt.
- `node docs/coursework/check-css.mjs`: final CSS checks passed for both outputs. The unchanged acceptance requires compiled Tailwind directives and the required flex layout. The checker was broadened to scan static/ recursively because Turbopack stores CSS under static/chunks; the failed static/css-only path attempt is retained separately.
- `node docs/coursework/check-http.mjs`: final 9 scenarios passed, 0 failed, 0 skipped, exit 0, against the corrected default build. The structured output stores source-file hashes and build-manifest identity, never OTP/session values. It uses a new isolated SQLite DB, loopback 3201 and explicit mock payments. Its server is stopped at completion.

### Failed attempts retained

The first HTTP setup required an existing empty SQLite file. The first redirect check incorrectly assumed every App Router redirect uses HTTP 3xx; actual streaming output used HTTP 200 with an explicit login navigation directive. The corrected check requires that directive and no private marker, rather than accepting any HTTP 200. Failed outputs are retained under http-setup-attempt, http-initial-request and http-redirect-diagnosis.

An npm-wrapper attempt did not forward the Webpack flag; the retained log is still Turbopack and is not counted as a Webpack result. Direct CLI execution was used thereafter. The first direct Webpack compile exposed unprocessed Tailwind in actual browser rendering. The css-before check failed with uncompiled directives. A custom-loader correction then disabled Next.js built-in CSS and failed compilation. Contract revision 2 uses the documented shared PostCSS adapter; only the later builds and styled visual check are accepted.

### Selected browser evidence after correction

The agent used the in-app browser against the isolated local demo, signed in through the normal test challenge, opened the persisted confirmed order, logged out and followed its protected URL, then signed in as an unrelated customer and observed the unavailable-page state. Both sessions were signed out afterward and the local server was stopped. No full manual UI order-creation journey is claimed.

Accepted images are in evidence/images. Synthetic order SN-955842 shows total THB 1100, paid mock deposit THB 330, remaining THB 770 and appointment 2 January 2030 at 10:00 Bangkok. Browser measurements: document width 1265 within viewport 1280 CSS pixels; visible header SVG widths no greater than 28 CSS pixels. Earlier unstyled images in ignored output/coursework/demo-* are diagnostic failures and are excluded from accepted report illustrations.

### Remaining scope

Course master specification/reuse decision, genuine independent student test/review evidence, complete selected UI-created journey, impossible-calendar-date boundary and final human release acceptance remain open. No home-server deployment, real SMS/payment or off-machine backup change occurred.
