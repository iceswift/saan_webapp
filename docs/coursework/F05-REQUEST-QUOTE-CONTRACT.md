# F-05 service request and quote contract

Issue #48. Sprint 2. This revision records the existing request/quote workflow on staging 60be265 and specifies prospective private-read coverage. Quote selection and order creation belong to #49.

## Requirements and workflow

FR-05, with BR-05 and NFR-01 for private fields. BR-01 governs authoritative order pricing in #49. A signed-in customer submits a service request. Eligible shops can open its details and submit or update their own quote. The customer reloads the request and compares the available quotes before selection.

| Layer | Contract |
| --- | --- |
| Customer UI | Submit through the request form. Follow the returned request ID to its detail page. Show saved request fields and quotes with shop names, prices and notes. Show both quotes and the lowest available offer when at least two are available. |
| Provider UI | The request tab lists open requests for verified shops in the request area. Each shop sees only its own saved quote in this view. Before verification the shop can view its profile status. |
| Server mutations | createRequest uses session identity and accepts REMOVE or REPAIR, description 10–2,000 characters, supported area, address 5–500 characters, up to six allowed upload URLs, optional owned shrine and bounded coordinates. sendQuote derives the shop from its owner session, requires VERIFIED, open request and matching area, and accepts integer baht 1–10,000,000 and optional note up to 1,000 characters. Expected errors use the standard action result. |
| Server reads | Customer request detail is scoped to the customer who created it. The provider request queue returns private details only to a verified shop covering the request area. The provider quote projection is restricted to that shop. |
| Data | ServiceRequest belongs to the signed-in user, starts OPEN, and stores the request inputs. Quote belongs to the request and shop, starts SENT, and is unique by request/shop. Updating a quote replaces its price and note in place. The accepted-quote transition is outside this contract. No schema changes are required. |

## Acceptance and software test specification

D2-F05-01 runs against built Server Actions, real synthetic sessions and a disposable SQLite database. The command is node docs/coursework/check-http.mjs after a production build.

| AC | Fixture and action | Expected result |
| --- | --- | --- |
| F05-AC-01 | Submit a Bangkok repair request as a customer, then reload. Attempt malformed input and an unsigned submission. | Saved row has the customer's owner ID and submitted fields. Owner detail shows the saved request. Invalid or unsigned submissions create no request. |
| F05-AC-02 | Two verified Bangkok shops quote distinct integer prices. Reload as each shop and then as the customer. Update one quote. | Two SENT rows exist and each provider sees only its own quote. Customer detail displays both prices and notes. Updating retains the original quote ID and replaces the saved terms. |
| F05-AC-03 | Request reads as an unrelated buyer, unverified shop and out-of-area shop. Attempt quote writes as unverified, out-of-area and non-shop sessions, and with an invalid price. | Private request address and description are absent from forbidden reads. Denied submissions leave quotes and quote notifications unchanged. |
| F05-AC-04 | Close an open request as its owner. Attempt another quote and reopen the provider queue. | The closed request is absent from the queue. Another quote is rejected and existing quote and notification rows are unchanged. |

## Definition of done

Record actual results and tested SHA for each AC. Link a substantive teammate review, staging integration and the accepted release. Record any pending verification explicitly. The source history for the pre-existing workflow starts before this contract.
