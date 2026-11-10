# Lab 5: Saan GCP deployment and CI/CD plan

This is the Saan-specific implementation plan for Lab 5. It distinguishes checked-in automation from cloud resources that still require explicit setup and evidence. No GCP resource is claimed as provisioned by this document.

## Architecture and adaptation

The Starter Kit is a Vite/Express multi-service example. Saan is one Next.js 16 service, built using the repository's multi-stage Dockerfile, running as UID 1000, with Prisma 6 and PostgreSQL. The service listens on port 3000. `/api/health` executes a database query and returns `{"status":"ok"}` only when the database is reachable.

Planned Lab topology:

| Role | GCP service | Proposed setting | Purpose |
|---|---|---|---|
| Web application | Cloud Run | `asia-southeast1`, min instances 0, max 3 | Public HTTPS service; deploy immutable image digest |
| PostgreSQL | Cloud SQL for PostgreSQL 16 | Smallest course-compatible shared-core tier; automated backups | Persistent relational data; private Cloud SQL connection from Cloud Run |
| Container images | Artifact Registry Docker repository | Same region as Cloud Run | Store commit-tagged image; deploy by digest |
| Uploaded files | Cloud Storage bucket mounted with Cloud Run volume | `/data/uploads`, access as UID/GID 1000 | Preserve the existing filesystem storage adapter and stable file keys |
| Deployment identity | GitHub Actions Workload Identity Federation | Dedicated deploy service account | Keyless CI authentication with least privilege |
| Runtime identity | Dedicated Cloud Run service account | Read only required secrets; access SQL and upload bucket | Separate application privileges from deploy privileges |

These are proposed names/settings, not observations of existing resources. Confirm the team's project, available region/quota, budget controls, and the course guide before provisioning. No database password, API key, private identifier, personal phone, or service account key belongs in Git or this public document.

## Reviewed release sequence

1. Push a feature branch and open a pull request to `staging`; the required CI checks must pass and a teammate must review it.
2. Merge the reviewed feature PR to `staging`.
3. Open a release PR from `staging` to `main`; require a fresh teammate approval and passing required checks.
4. Merge only the approved release. `.github/workflows/deploy-gcp.yml` is triggered by a push to `main`; its reusable CI must pass before deployment continues.
5. Build and push `saan:<full-40-character-commit-SHA>` to Artifact Registry. Resolve that tag to its image digest and deploy by digest.
6. Run the Prisma migration job before creating the candidate app revision. A failed migration stops the release before service traffic changes.
7. Create the new Cloud Run revision with no traffic and a `candidate` traffic tag. Read its dedicated URL from the matching tagged entry in the Cloud Run service's traffic status. Check the candidate URL's database-backed health route and HTML home page.
8. Move 100% traffic to the candidate; smoke-check the service URL. On a post-promotion smoke failure, restore the previous 100%-traffic revision.
9. The manual rollback action accepts only a full lowercase commit SHA already in Artifact Registry and requires explicit schema-compatibility confirmation. It reuses the old image and does not roll back database schema/data.

The release workflow expects the service, migration job, image repository, SQL connectivity, secrets, runtime identity, upload mount, IAM and unauthenticated service invocation to have been provisioned and tested first. Configure Artifact Registry's immutable Docker tags; the workflow verifies this before publishing and reuses an existing SHA tag on reruns. It does not create cloud resources or infer configuration. Bootstrap the service separately with a known-good 100%-traffic revision; the automated release refuses to run without one so a failed promotion always has a recovery target. A protected GitHub Environment named `lab5-gcp` must have a required reviewer before its project variables are configured.

The pre-created Cloud Run migration job must use the same image, Cloud SQL connection, runtime service account and Secret Manager `DATABASE_URL` binding as the service, with this command override and `/app` working directory:

```sh
node node_modules/prisma/build/index.js migrate deploy --schema prisma/postgresql/schema.prisma
```

The workflow only changes the migration job's image and the service's image. Treat the rest of the service/job configuration as managed setup; review any later runtime-configuration change separately rather than silently replacing it during each release. The service must allow the unauthenticated health/home smoke request for the course's public URL. Do not configure public test login to achieve this.

## Required GitHub Environment variables

Configure these as variables (not secrets) in the protected `lab5-gcp` Environment only after project and resource values are verified. They are configuration, not credentials.

| Variable | Required value |
|---|---|
| `GCP_PROJECT_ID` | Confirmed team project ID |
| `GCP_REGION` | Confirmed Cloud Run/Artifact Registry region |
| `GCP_ARTIFACT_REGISTRY_REPOSITORY` | Existing Artifact Registry repository name |
| `GCP_CLOUD_RUN_SERVICE` | Existing Cloud Run service name |
| `GCP_MIGRATION_JOB` | Existing Cloud Run migration job name |
| `GCP_WIF_PROVIDER` | Full Workload Identity Provider resource name |
| `GCP_WIF_SERVICE_ACCOUNT` | Dedicated deploy service account email |
| `SAAN_PUBLIC_SITE_URL` | Existing service's confirmed HTTPS URL, used at Next.js build time |

GitHub Actions receives short-lived credentials through WIF; do not create or upload a service-account JSON key. Restrict the WIF provider's repository/branch claims to `iceswift/saan_webapp` and the protected `main` branch. Restrict deploy IAM to the named service, job and repository where GCP supports resource-level grants.

## Runtime configuration contract

The names below are the runtime interface found in the source and deployment configuration. Only configure the values needed for the selected Lab workflow. Store sensitive values in Secret Manager and expose them to Cloud Run/Cloud Run Jobs by secret version. Do not turn on test login, mock payments, SMS, gateway mutations or reconciliation for a public service.

| Variable | Purpose | Classification / Lab default |
|---|---|---|
| `DATABASE_URL` | Prisma PostgreSQL connection | Secret; Cloud SQL connection and private password; required for service and migration job |
| `SITE_URL` | Canonical metadata origin | Public configuration; set to confirmed HTTPS URL |
| `NEXT_PUBLIC_SITE_URL` | Build-time metadata/Open Graph origin | Public configuration; pass the same confirmed HTTPS URL to Docker build |
| `UPLOAD_DIR` | Existing filesystem upload adapter path | Non-secret; `/data/uploads`, backed by persistent bucket mount |
| `OPERATIONS_DIR` | Optional operational heartbeat path | Non-secret; omit until durable operations storage/worker is designed for Cloud Run |
| `APP_ENV` | Runtime policy environment | Non-secret; `production` for the public service; never enable staging test mode publicly |
| `STAGING_TEST_MODE`, `STAGING_TEST_PHONES` | Private synthetic OTP access | Sensitive operational allow-list; leave disabled/unset on any public service |
| `PAYMENT_PROVIDER` | Checkout provider selector | Non-secret; production-safe unconfigured/mock behavior only as approved by app policy; Lab smoke must not submit payment |
| `PAYMENT_MUTATIONS_DISABLED` | Pause payment mutations | Non-secret safety switch; keep enabled for public Lab deployment unless separately approved and configured |
| `ADMIN_PHONES` | Role-protected admin identity list | Personal data; omit until a real, approved authentication path exists |
| `SUPPORT_EMAIL`, `SUPPORT_PHONE`, `SUPPORT_LINE_URL` | Public support contacts | Public contact data; unset until the owner supplies verified contacts |
| `SMS_PROVIDER`, `SMS_SEND_ENABLED` | OTP delivery integration selection | Non-secret feature flags; keep `unconfigured`/false; no production SMS provider exists |
| `OMISE_TEST_SECRET_KEY` | Omise sandbox API secret | Secret; not required by Lab pipeline; never use a live key |
| `OMISE_API_VERSION` | Omise API version | Non-secret; only set when sandbox integration is deliberately configured |
| `OMISE_WEBHOOK_ENABLED`, `OMISE_WEBHOOK_SECRET`, `OMISE_WEBHOOK_PREVIOUS_SECRET` | Optional sandbox webhook verification | Feature flag and secrets; keep disabled/unset for Lab deployment |
| `OMISE_PAYOUT_TEST_ENABLED`, `OMISE_PAYOUT_TEST_RECIPIENT`, `OMISE_PAYOUT_TEST_PROVIDER_ID` | Synthetic-shop sandbox payout controls | Sensitive identifiers/feature flags; keep disabled/unset |
| `PAYMENT_RECONCILIATION_ENABLED`, `PAYMENT_WORKER_SECRET`, `PAYMENT_WORKER_URL` | Optional internal payment reconciliation worker | Secret/URL/feature flag; not part of the one-service Lab deployment; keep disabled |
| `OMISE_CONTRACT_SPIKE_CREATE` | Guard for a separate contract spike script | Non-secret flag; keep false; not used by deployed app |
| `REFUND_CASE_TEST_MODE` | Refund-case sandbox behavior | Non-secret flag; leave disabled in production |

`NODE_ENV` is set by the production Node image. CI-only values such as a disposable `DATABASE_URL` and mock payment provider belong only in isolated test jobs.

## Persistence design and proof

PostgreSQL is the source of durable application state. Configure Cloud Run's Cloud SQL connection and use the private Cloud SQL connection string from Secret Manager. Enable Cloud SQL automated backups and point-in-time recovery only if supported by the selected course-compatible tier; record the selected retention and complete one restore drill before claiming database recoverability.

Saan stores uploads using Node filesystem operations below `UPLOAD_DIR`; a Cloud Storage FUSE volume mounted at `/data/uploads` can preserve this interface. Configure the bucket mount on the Cloud Run service, grant the runtime service account object access, and verify UID/GID 1000 write/read permissions. Google documents that FUSE writes are staged locally and flushed on close or `fsync`; therefore, upload verification must wait for the request/file handle to close and then fetch the same `/api/files/<key>` URL after a service revision replacement. Keep files small enough for Cloud Run's memory budget and test concurrent upload behavior before relying on this path. Do not call the upload store durable until byte-for-byte readback after replacement has passed.

Evidence drill:

1. Use a synthetic Lab-only record and harmless test image; record its SHA-256 locally without publishing personal data.
2. Confirm the DB record and uploaded file are accessible through the app.
3. Deploy a new image revision (or force an instance replacement), then fetch the same record and file URL.
4. Confirm DB identity and file SHA-256 match. Repeat after an application rollback.
5. Capture redacted screenshots/log links and cleanup only synthetic test records through the application's supported path.

Official references: [Cloud Run rollouts and tagged revision URLs](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration), [Cloud Run service update flags](https://docs.cloud.google.com/sdk/gcloud/reference/run/services/update), [Cloud Run and Cloud Storage volume mounts](https://docs.cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts), [Cloud Run and Cloud SQL for PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/connect-run), [Workload Identity Federation for deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).

Artifact Registry Docker repositories support immutable tags; enable the repository setting before connecting the release workflow. See [Artifact Registry image tag immutability](https://docs.cloud.google.com/artifact-registry/docs/docker/names).

## CI, Docker and local commands

The reusable workflow runs the same checks for pull requests and reviewed `main` deployments. The Docker image is built once in CI without publishing on feature PRs; a reviewed release is built/published with its full source SHA only after protected CI succeeds.

```sh
npm ci
npx next typegen
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run db:postgres:check
npm run build
docker build --tag saan:local .
npm run db:postgres:deploy
```

Use only an isolated disposable PostgreSQL database for the final two database migration/test commands; never point lab tests at the running Saan database. `npm run db:seed` is a development-only seed, not a production initialization step. Do not seed a public database with synthetic accounts or personal data.

## Acceptance gate and current blockers

- No deployment evidence is claimed until CI on the final PR head passes, the release PR is reviewed, and the GCP workflow completes.
- The deployment workflow and Saan-specific docs are source preparation; no GCP resource or service has been provisioned here.
- Billing preflight is not accepted based solely on an earlier verbal “limit set”: verify the active credit and spend controls in the selected project; an alert budget alone is not an enforceable cap. Do not create billable resources or accept any prepayment/upgrade while this account state is unresolved. Follow the course guide and ask the instructor/TA if the console requires payment or an upgrade. Do not include account-specific billing details in the public repository.
- Production authentication is not ready: no production SMS provider, public domain or verified support recovery path exists. The console-code OTP is test-only. Do not enable public test login or claim an end-to-end authenticated business operation (Lab C04) until a safe, approved test arrangement exists.
- Cloud SQL/GCS persistence, deployment, migration-failure blocking, rollback and final grader-facing accessibility all need real evidence before submission.
