# Saan home-server handoff

Read `docs/OPERATIONS.md` and `docs/DEPLOYMENT-STATUS.md` before changing this deployment. Repository: https://github.com/iceswift/saan_webapp . Keep these documents synchronized with verified changes.

The home-server stack belongs to `/home/ice/saan` with configuration in `deploy`, durable database/uploads in `data`, backups in `backups`, and versioned source in `releases`. Source image is tagged with the commit recorded in the status document. Credentials in `deploy/deployment.env` must not be printed or committed.

Use only this stack's Compose project. Do not alter gold-api, thai-gold-web, webcam/Tailscale port 443, host disk/LVM, UPS or alerting. No `down -v`, deletion of data, reboot, or cross-project cleanup. Do not bypass missing sudo permissions. Check current state before trusting older notes.

Backups are deliberately kept on the home server only at the owner's request. Ask before transferring database/uploads to another device or service. Public access, real payments and real SMS are not configured.
