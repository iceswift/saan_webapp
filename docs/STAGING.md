# Staging preparation

## Database

Local development continues to use `prisma/schema.prisma` (SQLite). PostgreSQL uses the generated `prisma/postgresql/schema.prisma` and its own migration history. `npm run db:postgres:schema` regenerates the PostgreSQL schema from the canonical SQLite schema. CI checks that they match. Do not edit the generated file manually.

Use a new empty PostgreSQL 16 database dedicated to staging. Do not point these commands at an existing production database. The initial migration creates the full schema; it does not import local users, orders, payments or photos. Do not run the development seed against staging.

Configure `DATABASE_URL` and the other variables from `.env.staging.example` in your hosting environment. Generate the PostgreSQL client **after** `npm ci` (its postinstall generates the local SQLite client):

```sh
npm ci
npm run db:postgres:check
npm run db:postgres:generate
npm run db:postgres:deploy
npm run build
npm run start
```

Run migrations as a single release job before starting the new application. Build and runtime must use the PostgreSQL client. When returning to SQLite development in the same checkout, run `npx prisma generate` and restart the development server. Prefer separate checkouts/containers for the two environments. Never run the SQLite integration runner with a PostgreSQL-generated client.

For later database changes: update the canonical schema, regenerate the PostgreSQL schema, create and review an incremental migration using `prisma migrate dev --schema prisma/postgresql/schema.prisma --name <change>` against a disposable PostgreSQL development database with shadow-database permissions. Commit both schemas and the new migration; never rewrite an applied migration. Back up staging before applying changes. Restore backups into a separate database to verify them before relying on rollback.

## Database validation

The PostgreSQL CI job starts a fresh PostgreSQL 16 instance, deploys migrations twice, and tests unique money-operation keys, foreign-key deletion protection and transactional rollback through the generated Prisma client. `npm run test:postgres` requires the dedicated database name `saan_test`; it creates and removes only its own fixtures. These are database compatibility checks, not a replacement for the 33 SQLite service tests or an end-to-end staging test.

## Home-server implementation

The Docker deployment and recovery runbooks are now in [OPERATIONS.md](OPERATIONS.md). Verified results and remaining access limitations are tracked in [DEPLOYMENT-STATUS.md](DEPLOYMENT-STATUS.md). Consult those documents before assuming this earlier preparation checklist is still pending.

## Remaining deployment prerequisites

- Provision the staging database and select a hosting environment; no remote resources have been created by this change.
- Configure object storage before accepting uploads. Uploads currently write to the local filesystem and are unsuitable for ephemeral hosting.
- Replace development SMS/OTP and review authentication before granting access to real users. Use synthetic data while these integrations remain simulated.
- Private staging test login and mock payments are now separately gated; see STAGING-TESTING.md. Ordinary production configuration still disables simulated payments. Real charges require a reviewed provider adapter.
- Resolve GitHub Actions billing to run hosted checks. Local migration generation and schema validation do not prove a successful PostgreSQL deployment.

No hosting provider, database credentials or storage account is assumed by this setup.
