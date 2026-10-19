# Private vow-book locations

Implemented 19 October 2026. The old vow book stored a place description only; coordinates were not part of its schema. `Vow.lat/lng` are now optional and existing records remain valid with both null.

## Customer behavior

- New vow: optionally expand the map below the place field, search for a location or place a pin manually. Current-device location is requested only after the user presses the existing location button. Name/place text remains independent and is never sent to a geocoder automatically.
- Vow detail: add a pin to an old record, open its map, edit/move it, or clear and save it. Clearing coordinates does not change place, wish, promise, status or reminder.
- A user-initiated Google Maps link receives destination coordinates only, not wish/promise content. The UI explains this before navigation. No route, background tracking, automatic geolocation, public map or sharing link is created.
- Uses existing LocationPicker, ExpandableMap and MapView. Basemap/search providers are those of the existing map subsystem; the map is mounted only when opened or editing. A saved map's tooltip uses a constant label, never untrusted place text interpreted as HTML.

## Access and validation

Creation derives userId from the signed-in session. Reading uses the existing `getMyVow(id, userId)` owner filter. Updating uses `saveOwnedVowLocation` with a single owner-scoped update; knowing an ID does not grant access. Both coordinates must be supplied together, finite numbers within the existing map subsystem's Thailand bounding box. This box is an approximate application boundary, not a geographic border check. Values are rounded to six decimals on the server.

Additive PostgreSQL migration `20261019010000_vow_location` adds nullable columns plus a check requiring either both null or a complete in-bounds pair. Existing records are not geocoded or rewritten. Apply after a server-local backup, before deploying the new client/application. Rollback can use the old app while retaining the columns; do not drop pins or restore old data blindly. The canonical SQLite schema and generated PostgreSQL schema stay synchronized.

## Validation

Two integration tests cover legacy null pins, owner-only reads/updates, rounded persistence, clearing without losing text, and rejection of malformed/partial/out-of-bounds values. Included in SQLite and isolated `/saan_test` PostgreSQL runners. Deployment/browser results and backup evidence are recorded in DEPLOYMENT-STATUS.md. The feature does not change Omise settings, settlement behavior, backups or public access.
