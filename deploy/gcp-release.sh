#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID in the protected lab5-gcp Environment}"
: "${REGION:?Set REGION in the protected lab5-gcp Environment}"
: "${AR_REPOSITORY:?Set AR_REPOSITORY in the protected lab5-gcp Environment}"
: "${SERVICE_NAME:?Set SERVICE_NAME in the protected lab5-gcp Environment}"
: "${MIGRATION_JOB:?Set MIGRATION_JOB in the protected lab5-gcp Environment}"

ROLLBACK_SHA="${ROLLBACK_SHA:-}"
ROLLBACK_SCHEMA_COMPATIBLE="${ROLLBACK_SCHEMA_COMPATIBLE:-false}"
if [[ -n "$ROLLBACK_SHA" ]]; then
  [[ "$ROLLBACK_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid rollback SHA.' >&2; exit 1; }
  [[ "$ROLLBACK_SCHEMA_COMPATIBLE" == 'true' ]] || { echo 'Refusing rollback without schema-compatibility confirmation.' >&2; exit 1; }
  IMAGE_SHA="$ROLLBACK_SHA"
  ROLLBACK='true'
else
  IMAGE_SHA="${GITHUB_SHA:?GITHUB_SHA is required for a normal release}"
  [[ "$IMAGE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'GITHUB_SHA must be a full commit SHA.' >&2; exit 1; }
  ROLLBACK='false'
fi

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPOSITORY}/saan:${IMAGE_SHA}"
IMAGE_DIGEST="$(gcloud artifacts docker images describe "$IMAGE" \
  --project="$PROJECT_ID" \
  --format='value(image_summary.fully_qualified_digest)')"
EXPECTED_PREFIX="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPOSITORY}/saan@sha256:"
[[ "$IMAGE_DIGEST" == "$EXPECTED_PREFIX"* ]] || { echo 'Could not resolve the SHA-tagged image to an Artifact Registry digest.' >&2; exit 1; }

# Preserve a simple 100% traffic state so a failed smoke check can restore it.
TRAFFIC_JSON="$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format=json)"
PREVIOUS_REVISION="$(python3 -c '
import json, sys
service = json.load(sys.stdin)
traffic = [entry for entry in service.get("status", {}).get("traffic", []) if int(entry.get("percent", 0) or 0) > 0]
if not traffic:
    print("")
elif len(traffic) == 1 and int(traffic[0].get("percent", 0)) == 100:
    entry = traffic[0]
    revision = entry.get("revisionName")
    if not revision and entry.get("latestRevision"):
        revision = service.get("status", {}).get("latestReadyRevisionName", "")
    print(revision or "")
else:
    raise SystemExit("Refusing automated deployment while traffic is split across revisions.")
' <<< "$TRAFFIC_JSON")"
[[ -n "$PREVIOUS_REVISION" ]] || {
  echo 'Refusing automated release without an existing 100%-traffic revision; bootstrap and smoke-check the service first.' >&2
  exit 1
}

if [[ "$ROLLBACK" == 'false' ]]; then
  # The job already carries its Cloud SQL connection, runtime identity and DB secret.
  # A failed migration exits here before a new service revision receives traffic.
  gcloud run jobs update "$MIGRATION_JOB" \
    --image="$IMAGE_DIGEST" --project="$PROJECT_ID" --region="$REGION" --quiet
  gcloud run jobs execute "$MIGRATION_JOB" \
    --wait --project="$PROJECT_ID" --region="$REGION" --quiet
fi

# Create the candidate revision without moving production traffic.
gcloud run services update "$SERVICE_NAME" \
  --image="$IMAGE_DIGEST" --no-traffic \
  --project="$PROJECT_ID" --region="$REGION" --quiet

REVISION="$(gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" --region="$REGION" \
  --format='value(status.latestCreatedRevisionName)')"
[[ -n "$REVISION" ]] || { echo 'Cloud Run did not report a created revision.' >&2; exit 1; }
REVISION_URL="$(gcloud run revisions describe "$REVISION" \
  --project="$PROJECT_ID" --region="$REGION" \
  --format='value(status.url)')"
[[ "$REVISION_URL" == https://* ]] || { echo 'Cloud Run did not report an HTTPS revision URL.' >&2; exit 1; }

# Check the new revision, including its database-backed health endpoint, before promotion.
python3 deploy/gcp-smoke.py "$REVISION_URL"
gcloud run services update-traffic "$SERVICE_NAME" \
  --to-revisions="${REVISION}=100" \
  --project="$PROJECT_ID" --region="$REGION" --quiet

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" --region="$REGION" \
  --format='value(status.url)')"
if ! python3 deploy/gcp-smoke.py "$SERVICE_URL"; then
  if [[ -n "$PREVIOUS_REVISION" ]]; then
    echo "Smoke check failed after promotion; restoring ${PREVIOUS_REVISION}." >&2
    gcloud run services update-traffic "$SERVICE_NAME" \
      --to-revisions="${PREVIOUS_REVISION}=100" \
      --project="$PROJECT_ID" --region="$REGION" --quiet
  else
    echo 'Smoke check failed on the first revision; there is no previous revision to restore.' >&2
  fi
  exit 1
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "image_sha=$IMAGE_SHA"
    echo "image_digest=$IMAGE_DIGEST"
    echo "revision=$REVISION"
    echo "service_url=$SERVICE_URL"
    echo "rollback=$ROLLBACK"
  } >> "$GITHUB_OUTPUT"
fi

echo "Promoted ${REVISION} from ${IMAGE_SHA} (${IMAGE_DIGEST}) at ${SERVICE_URL}."
