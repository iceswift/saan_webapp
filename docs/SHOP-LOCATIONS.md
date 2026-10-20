# Public shop locations

## Contract

`Provider.publicAddress` is optional owner-supplied public business text, trimmed and limited to 500 characters by the existing authenticated provider profile action. An omitted field preserves the existing value; an empty string clears it. The action derives the provider from the signed-in user, never a submitted provider ID. No reverse geocoding or automatic address assignment occurs.

`/shops` lists VERIFIED providers, including providers without products or coordinates. The explicit public projection contains only id, name, kind, address, service areas and an approximate business location. It never queries customer/order/shrine/vow coordinates. Coordinates require a complete Thailand-bounds pair and are rounded to three decimals, consistent with existing public shop pins. Public address text may be more precise if the owner chooses to publish it; the profile field explains this distinction.

The directory supports name/address search, service-area and provider-kind filters, keyboard-operable map markers, and a persistent grouped list. Selecting a marker or row reveals the shop and a link to its public page. Service-area filters describe where a provider works, not the physical location of its shop. Shops without pins remain searchable. List fallback remains usable when map loading fails. Existing Leaflet/OpenStreetMap integration and attribution are reused; no new map service dependency or geolocation request.

Shop pages display address, approximate map, telephone link and user-initiated directions. Missing data is stated explicitly. Directions use the rounded public point, and users are asked to confirm the destination before travel.

## Migration and rollback

`20261020010000_provider_public_address` adds a NOT NULL TEXT column with an empty default. Existing businesses remain unmodified apart from this empty field. Take a consistent home-only backup before migration. The previous image can run against the expanded schema; retain the column and new addresses during rollback. Never restore an old dump over accepted new writes.

## Validation

`tests/shop-directory.integration.test.ts` checks verification status, legacy defaults, invalid/partial locations, coordinate rounding, malformed area JSON and the exact public projection, including exclusion of a private vow coordinate. Use only isolated money-test.db or PostgreSQL saan_test. Deployment/browser evidence is recorded in DEPLOYMENT-STATUS.md.

## Follow-up at scale

The initial directory loads all verified shops. Add bounded map queries, clustering and list pagination when measured provider counts justify it. Production tile capacity/policy needs review before public high-volume launch. Saving favorites/swipe browsing is a separate future feature.

## Map-first explorer (20 October 2026)

The directory now uses a fixed-height workspace: desktop search/results sidebar beside the map; mobile search overlay and a bottom results panel. The mobile handle toggles by keyboard/tap and snaps open/closed after a vertical pointer drag; only the handle captures dragging, so list scrolling and map panning keep their normal behavior. Reduced motion removes the height transition.

Marker and list selection share one ID. Selected rows use aria-pressed and markers receive a vermilion selected state. Selecting a shop expands the mobile results and focuses its detail heading without scrolling the whole page. The shop page retains phone/directions/reviews; the directory uses the existing minimal public projection.

“Search this area” explicitly snapshots the current map bounds for the result list. Panning alone does not silently remove results. Pins retain the text/service-area/type query and naturally move in/out of view. “All areas” clears the physical-bounds constraint, including unpinned shops again. Changing the text/provider/service-area filters clears the bounds constraint. Physical shop location and service areas remain distinct. No geolocation request, geocoding, new map vendor, schema or payment changes.
