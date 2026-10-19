# Customer appointment tools

Implemented 19 October 2026. Adds two secondary actions to customer order details when a confirmed appointment exists and order state is CONFIRMED, DONE or COMPLETED:

- Download an `.ics` calendar snapshot for import into the user's calendar application.
- Copy a Thai appointment summary (service title, order code, confirmed date/time, shop and address), with selectable-text fallback if clipboard access fails.

Nothing is posted to a third party. A downloaded file and copied text contain the job address, so the UI advises importing into a private calendar. Importing or sharing is the user's subsequent action. This is not calendar synchronization: if an appointment changes or is cancelled, the user must update the calendar entry manually and check Saan for the latest status. No automatic reminder delivery or end time is promised.

## Boundary and implementation

`GET /orders/[id]/calendar` checks the signed-in user and scopes the database query to the customer owner. Unauthenticated requests return 401; other users and missing orders return 404. Missing appointment or ineligible/cancelled state returns 409. The server always reads current appointment data at download time. Response uses `private, no-store`, `nosniff` and attachment headers; no share tokens or public calendar feeds are created.

`src/lib/appointment-calendar.ts` generates UTF-8 iCalendar with UTC DTSTART, stable order-based UID and current DTSTAMP, no invented end time, CLASS:PRIVATE and no attendee/organizer invitations. Text is escaped and physical lines folded at 75 UTF-8 octets without splitting characters. Reference: [RFC 5545](https://www.rfc-editor.org/info/rfc5545/). CLASS:PRIVATE is a calendar hint, not an access-control guarantee after import. A stable UID can help calendar clients identify the same event, but repeated imports are not guaranteed to merge in every application.

The client fetches the private route and shows failures in Thai rather than navigating to an error file. Object URLs are revoked after download. Clipboard fallback does not save data to local storage. No dependencies or schema changes.

## Verification

`node --import tsx --test tests/appointment-calendar.test.ts` covers Bangkok-to-UTC time, no invented duration, stable identity, invalid dates, Thai byte-length folding and newline/property injection escaping. Production build, TypeScript/lint, deployed authorization checks and browser results are recorded in DEPLOYMENT-STATUS.md. Native calendar import behavior on real iOS/Android/desktop calendar apps still needs device testing; successful download does not prove every calendar client's import UI.
