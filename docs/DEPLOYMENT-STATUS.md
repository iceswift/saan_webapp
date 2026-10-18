# Deployment status

Updated 2026-10-18. See OPERATIONS.md for architecture and runbook.

- Home server reachable over SSH; existing services inspected read-only.
- PostgreSQL migration, portable image/Compose, stable upload path, database health endpoint and backup/restore scripts implemented.
- No real payment or SMS provider configured. Production builds reject payments.
- Production Docker build passed on the home server. Source/image tag: `saan:d58f65e4b281a8bc84420ae84e729e01ba27486d`. Build reported dynamic filesystem tracing warnings and npm dependency audit findings; review before public release.
- Deployed image ID: `sha256:ec99e601f6eb109990806ef09be5af18636b6379c6dd8c8d9e3470dd07a491ea`.
- Live Compose project: `saan-staging`, configuration `/home/ice/saan/deploy`, protected config `deployment.env`, data `/home/ice/saan/data`. Web binds **127.0.0.1:3100 only** through nginx. PostgreSQL has no published host port.
- App and database health checks passed. Home page returned HTTP 200. PostgreSQL initial migration deployed twice without changes. Dedicated `saan_test` database passed migration drift, relation, unique money-key, deletion protection and transaction rollback checks.
- Uploaded a synthetic one-pixel PNG through `saveImage`, created a synthetic user `saan-restore-proof`, recreated the app container and verified persistence.
- Backup `/home/ice/saan/backups/20261018T040014Z-2221189` contains database, uploads, image inventory and SHA256 checksums. It contains only synthetic staging data, not local development data.
- Restored that backup into the **separate** `saan-restore-drill` project using `/home/ice/saan/restore-drill/data` and loopback port 3101. Restored health passed, synthetic user count was 1, and served image matched the original byte-for-byte. A second restore correctly refused the nonempty database. Drill containers are stopped; their data is retained.
- Existing gold-api and thai-gold-web stayed running. The webcam route on Tailscale 443 was not changed.
- Private HTTPS 8443 is **not yet enabled**: `tailscale serve` returned permission denied. User must run `sudo tailscale serve --bg --https=8443 http://127.0.0.1:3100` on the server. Last observed Serve configuration still contained only the webcam on 443. Do not claim the external Saan URL works until verified.
- No authenticated browser flow, real SMS, simulated payment flow on this production image, or public endpoint has been tested. This deployment is a private infrastructure staging baseline, not a launch-ready service.
- User explicitly chose not to copy backups off the home server on 2026-10-18. No backup was transferred to the development PC. Off-machine copies, scheduling and retention remain unconfigured; same-machine backups do not cover disk/server loss.
- GitHub-hosted Actions blocked by account billing. Local results must be recorded separately.
