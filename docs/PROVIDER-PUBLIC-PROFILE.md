# Public provider profile

Implemented follow-up to the 4 November 2026 inclusive review. Deployment evidence is recorded separately in DEPLOYMENT-STATUS.md.

## Data contract

- `Provider.coverUrl`: nullable stable `/api/files/<random-key>.jpg|png|webp` key. Optional one owner-selected shop image. It is public, not an identity/verification document. New keys must refer to an existing upload; external URLs and traversal are rejected. Upload uses the existing authenticated 5 MB, signature-checked image pipeline. Clearing the profile reference does not delete the underlying file, which might be shared by another record.
- `Provider.contactHours`: trimmed plain text, at most 300 characters, empty by default. It describes when customers may contact/visit by arrangement. It does not imply current opening status, appointment availability or automatic response. Provider blocked dates continue to control booking availability independently.
- Public address and approximate coordinates retain their previous contracts. No address, image, time or pin is inferred automatically.

The authenticated action obtains `userId` from the session and calls `updateOwnedProviderProfile`. The service looks up the provider by that user ID and ignores any client-supplied provider ID. Optional omitted public fields preserve stored values; explicit empty text/null clears them. Clearing a base pin also clears its service radius; a radius without a pin is rejected server-side.

## UI

The registration/edit form labels photo and contact hours optional and public. The route-owned single-photo control shares upload-busy state with save, keeps the existing image on upload failure and announces progress/errors. Saved values appear on the public shop page and selected map detail. A shop photo also replaces the AI map thumbnail; AI fallback retains explicit illustration labeling. Public shop metadata prefers the owner-selected cover, then an existing product photo. No fake opening times or ratings are introduced. The old sample-hours accordion has been removed.

## Storage and migration

Additive PostgreSQL migration `20261104010000_provider_public_profile`; SQLite is generated from the main Prisma schema for development/tests. Existing providers receive empty contact hours and null cover. Existing stable upload keys stay outside the image in the configured upload directory. Backups already include this directory and the PostgreSQL dump. Keep both new columns on an image rollback; never drop user content to roll back presentation code.

## Verification boundaries

Regression coverage checks owner scope, explicit publication, omitted-field preservation, clearing, malformed/missing image references, length limits and radius consistency. QA uploads must use an isolated temporary upload directory, not the mounted app upload directory. Real provider photos/hours must be supplied by their owners; synthetic staging fixtures are not evidence of real business details.

On 4 November the deployed form was exercised through the browser: rejected a non-image text file, announced upload progress and temporarily blocked saving, accepted generated PNG fixtures, persisted photo/hours across reload, and showed the uploaded checker image in the customer map. Clearing the cover persisted and restored the explicitly labeled AI fallback. Only `staging-provider` changed; its contact availability begins "ข้อมูลสมมติ" and says there is no real shop. Test photo references were cleared after QA; underlying uploaded fixtures remain in storage/backup. Screenshot proof: ignored `output/staging/profile-checker-map-proof.png` and `provider-profile-final-map.png`.

Automated evidence: 64 isolated SQLite cases and 52 PostgreSQL-compatible cases passed, with TypeScript, targeted lint and Linux production build. Two initial overlapping PostgreSQL runs failed and are not counted as passes; a fresh host-locked serial run passed all 52. Native mobile file-picker and assistive-technology testing remain pilot work. Browser automation's image natural-size property returned zero even for visibly rendered content; actual checker-image screenshots and optimizer HTTP 200/file hashes were used instead of claiming those properties as proof.
