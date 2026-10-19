# Booking and service request forms

## Customer design pass — 20 October 2026

Source: `b64e1da`. This pass changes client interaction only; existing server authorization, request validation, order creation and payments remain in place.

### Choosing a new shrine

The four-question wizard now separates selection from navigation. Tapping an option selects it; the explicit Next action advances. The final action opens matching products. A missing answer produces an inline error and focuses the choices. The deliberate “unsure” and “no budget limit” null answers remain valid. Back preserves previous answers. Choosing a shrine still does not create an order or initiate a payment.

### Repair and removal requests

The request form has three stages: work details, site, review. Validation applies to the current stage, and final submission rechecks all required fields. Back retains state. Request type is selected locally instead of navigating away, so changing repair/removal does not lose description or uploaded image URLs.

Existing shrines appear before the site fields so choosing one can fill empty area/address fields. Saved addresses retain their existing explicit replacement behavior, including coordinates. Review shows the actual selected request type, description, area/address, related shrine, image count and pin presence. Only the final confirmation calls `createRequest`; it does not collect payment.

Request stage containers remain mounted and are hidden when inactive, preserving file-upload component state and in-flight work. They reuse the existing step-slide CSS and reduced-motion rules instead of remounting the upload component through StepSlide. No localStorage/sessionStorage drafts were added; refreshing or leaving the page still discards unsent form text.

## Validation record

TypeScript and targeted ESLint passed. Production build and staging browser evidence are recorded in DEPLOYMENT-STATUS.md after rollout.
