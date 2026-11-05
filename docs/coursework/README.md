# CPE 334 coursework workspace

This folder adapts the existing Saan product for Project Deliverable 1. It does not redefine the commercial product or claim that existing implementation was created after these course contracts.

## Deliverables and reproducibility

- `build_report.py`: reproducible English DOCX authoring source, including the report content.
- `PLAN.md`: editorial plan, source hierarchy, evidence policy and remaining decisions.
- `TEAM-VERIFICATION-WORKBOOK.md`: independent requirements, test and PR review tasks for Supanut, with unfilled actual-result records.
- `VERIFICATION-ADDENDUM.md`: chosen signed-in buyer policy and prospective query-test design.
- `BUILD-CONTRACT.md` and `check-css.mjs`: stylesheet regression contract and executable red/green check.
- `check-http.mjs`: real built action/session verification using a new isolated SQLite database, explicit synthetic login and mock payment on loopback port 3201. Requires a successful matching local build. No environment secrets are retained in its output.
- `evidence/`: release-specific command output and metadata. No environment files, credentials or application databases belong here.
- Final editable report and PDF: `output/coursework/Saan_CPE334_Deliverable_1.docx` and `.pdf` (ignored generated outputs).
- Rendered QA pages: `output/coursework/render/` (ignored intermediates).

Both student identities and the practical role allocation are confirmed. The report includes source inspection, query/database regression and session-backed HTTP evidence, while distinguishing them from browser journeys and independent student execution. Course-theme/reuse approval, genuine teammate reviews, the full selected UI journey and final release acceptance remain gates. Do not mark them complete from an AI-generated narrative.

## Rebuild

Use the Codex bundled Python with python-docx and Pillow. Run `build_report.py` from any directory. Prefer the documents skill `render_docx.py` and inspect every page. On this Windows host the helper failed because the runtime contains no LibreOffice; the verified fallback was hidden Word PDF export followed by bundled Poppler page rasterization. No new application was installed. PDF page ranges must be checked again after any layout change.

The coursework pass also identified a genuine missing Webpack stylesheet pipeline. The corrective configuration uses the official Tailwind PostCSS adapter and shared Next.js CSS handling. Domain services, schema, live payment settings, home-server deployment and backup destinations are unchanged. Local tests create their own databases under ignored storage/tests; they never use the application database.
