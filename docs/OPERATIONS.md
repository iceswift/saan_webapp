# Saan operations and AI handoff

## Architecture decisions (2026-10-18)

- Deploy a modular Next.js monolith, not microservices. A versioned Docker image runs the same code on the home server or a VDS.
- PostgreSQL 16 is separate from the web container. Database ports are not published. SQLite remains local-development only.
- Uploaded images have stable `/api/files/<random-key>` URLs. `UPLOAD_DIR` selects persistent storage outside the image. A future object-storage adapter must preserve these keys/URLs. This release implements filesystem storage only.
- Database sessions and OTP records are shared. Explicit private staging uses durable simulated receipts in PostgreSQL; local-development mocks remain process-local. Keep one app instance until Next.js multi-instance configuration is reviewed. Real gateway integration remains future work.
- Runtime `SITE_URL` controls canonical metadata; no home-server IP is stored in image records. TLS terminates at the private Tailscale entry point; nginx handles request size/forwarding before Next.js.
- No public staging access or real money yet. Production rejects test login/payments by default. Explicitly gated private staging allows only designated synthetic phones and simulated payments; see STAGING-TESTING.md. No real SMS delivery. Do not expose test mode publicly.

## Known home-server facts

SSH: `ice@100.110.85.29`, tailnet name `iceberg.taile08e5c.ts.net`. On 2026-10-18 live inspection showed ~13 GiB available RAM, `/srv` separately mounted with ~653 GiB free. Existing `gold-api` uses loopback 8000, `thai-gold-web` 8080, webcam 8081 through Tailscale HTTPS 443. Never change those services/routes as part of Saan deployment.

The `ice` user can use Docker but cannot write `/srv` or use noninteractive sudo. Saan uses `/home/ice/saan` until an administrator provisions another directory. Do not change disk/LVM/UPS/alerts, inspect other projects' secrets, reboot, or run `docker compose down -v`.

## Files and deployment

- Repository: `https://github.com/iceswift/saan_webapp`
- `Dockerfile`: PostgreSQL client generated during build; runtime runs as node (UID 1000).
- `deploy/compose.yml`: app + PostgreSQL + nginx, isolated Compose project. nginx binds loopback 3100 only. Log rotation and memory limits are configured.
- Copy `deploy/env.example` to `deploy/deployment.env` on the server, chmod 600. Generate a random URL-safe hexadecimal `POSTGRES_PASSWORD`. Never commit or display the populated file. Changing this password later also requires changing the PostgreSQL role password.
- `DATA_DIR` is an absolute persistent path with `uploads` writable by UID 1000; postgres owns its own data directory.
- Keep source checkout/releases separate from `data`, `backups`, and secrets. Do not put data below a directory removed during a release cleanup.

Build a unique image tag for each commit, record the deployed commit and image ID. With the environment file present:

```sh
docker build -t saan:COMMIT .
cd deploy
sh compose.sh up -d db
sh compose.sh run --rm --no-deps app node node_modules/prisma/build/index.js migrate deploy --schema prisma/postgresql/schema.prisma
sh compose.sh up -d app proxy
sh compose.sh ps
curl --fail http://127.0.0.1:3100/api/health
```

For an existing deployment: create a backup before migrations; inspect migration compatibility; apply migrations once; change image tag and run `up -d`. App rollback changes the image tag and recreates app/proxy. It does not roll back the database. Never blindly restore old data over newly accepted orders.

Private TLS entry point (only after checking existing routes/permissions): `tailscale serve --bg --https=8443 http://127.0.0.1:3100`. This must not reset or replace the webcam route on 443. If permission is denied, an administrator must authorize this specific route. Do not use Funnel. The intended URL is `https://iceberg.taile08e5c.ts.net:8443` and requires Tailscale access.

## Backup and restore

`sh deploy/backup.sh /ABSOLUTE/backup-directory` briefly stops only Saan's app to produce a consistent PostgreSQL dump + uploads archive, image inventory and checksums. The script restarts a previously running app even if a step fails. Backups contain personal data: permissions are restricted, transfer encrypted, and keep an encrypted copy on another machine/disk. Local copies alone are not disaster recovery. An off-machine schedule is not configured by these scripts.

To restore: prepare a separate Compose project/environment and **new empty DATA_DIR**, start only its database, and run `RESTORE_EMPTY_STACK=yes sh restore.sh /ABSOLUTE/backup-bundle`. It checks checksums and refuses a nonempty target. Restore does not start the app. Use a different loopback port for a drill. Verify counts, image bytes, login/session behavior and health before switching traffic.

Migration to another server: rehearse restore there; pause writes on the old server; take a final consistent backup; transfer it and the protected environment configuration; restore into a new empty target; start the exact source image version; check data and endpoints; then change ingress/DNS. Keep the old app stopped to prevent split writes. A short planned write outage is acceptable initially.

To move the exact image without a registry, use `docker save saan:COMMIT` on the source and `docker load` on the destination over a protected transfer. Record the image ID and verify it matches. The database and uploads are transferred separately via the consistent backup; never copy a running PostgreSQL data directory. Protect and transfer the environment file separately from repository source and backups.

## Checks and remaining work

Run PostgreSQL migration/constraint checks on a real PostgreSQL instance; schema validation alone is insufficient. SQLite service tests use a separately generated SQLite client and database. Never overwrite an active development server's generated client with PostgreSQL generation in the same checkout.

Before public use: production authentication/SMS, real payment adapter, storage off-machine backup destination and retention, monitoring and alert delivery. For multiple web replicas also review Next.js cache coordination, encryption key consistency and background job claiming. Restore drills must be repeated as data/schema evolve.

Update `docs/DEPLOYMENT-STATUS.md` after every deployment or restore drill. Record evidence and remaining gaps, never call an untested step complete.
