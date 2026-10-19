# Operations monitoring and home-only backups

Implemented 19 October 2026. This release does not enable live payments or public access.

## Admin monitoring

`/admin/operations` requires ADMIN authentication before reading health files or financial queues. The finance page links to it. It shows worker heartbeat, backup status and up to 50 oldest money operations requiring review (UNKNOWN/ACTION_REQUIRED, or PROCESSING/PENDING older than 30 minutes). The review count refers to UNKNOWN/ACTION_REQUIRED, not all aged pending operations. Financial age uses creation time so reconciliation polling never hides an old operation.

Worker heartbeat is recorded only after an authenticated reconciliation request, following both collection and payout batches. An exception records failure; missing/invalid data is unknown; a heartbeat older than five minutes is stale. A healthy heartbeat means the scheduler reached the application, not that every payment has settled. Unresolved payouts remain visible separately and are never automatically resent. This release includes the payout batch fairness fix from commit 359b4a5.

Health is recorded atomically under `OPERATIONS_DIR` (`/data/operations` in Compose), mounted from `DATA_DIR/operations`, outside uploads and outside the image. Files contain only timestamps and success flags; no keys, bank details or raw provider responses. The host directory must be owned by the app UID 1000 and private. A missing mount or write failure causes reconciliation HTTP 503 rather than a false healthy signal. Restores should start with an empty operations directory; old backup/worker health must not be mistaken for current health.

The page is a snapshot: reload to refresh. Alerts are displayed in admin, with sanitized worker errors in Docker logs; no email, LINE, external monitoring or messages have been configured. If the entire app/server is unavailable, this in-app monitor cannot notify the owner. External alert delivery remains a separate decision.

## Daily home-only backup

To install on the configured home server, copy `backup.sh`, `scheduled-backup.py` and `install-backup-cron.py` from `deploy/` into `/home/ice/saan/deploy/`, preserving the existing protected `deployment.env`. Verify the host user/app UID is 1000 and provision `/home/ice/saan/data/operations` owned by that user with mode 0700. Run `python3 /home/ice/saan/deploy/install-backup-cron.py`; it is safe to rerun and replaces only its marked block. The log is precreated with mode 0600. Confirm `systemctl is-active cron`, run the scheduled wrapper once, check its exit status and admin timestamps, then perform an isolated restore drill. Do not print the protected environment or credentials while checking configuration.

The home server runs `/usr/bin/python3 /home/ice/saan/deploy/scheduled-backup.py` from a marked user-crontab block daily at **03:00 Asia/Bangkok**. Installation verifies the host timezone, preserves existing cron entries and retains a private pre-change copy. Cron works without an active SSH session (unlike a user systemd timer when lingering is disabled). Inspect the cron daemon after server maintenance and recheck timezone after migration.

The wrapper takes an exclusive nonblocking file lock, calls `backup.sh`, verifies checksums and the uploads archive, then marks the bundle complete and atomically records status in `data/operations/backup.json`. Backup failure is recorded while retaining the previous successful timestamp. Logs stay at `/home/ice/saan/backup-schedule.log`; inspect and rotate this file during maintenance. Backup briefly stops both Saan's payment worker and app, restarts only those that were running, and leaves the database, proxy, webcam and unrelated projects alone.

Scheduled bundles live under `/home/ice/saan/backups/scheduled`. Retention keeps the latest **14 successful managed bundles**; a bundle is eligible only after checksum verification and creation of `.saan-scheduled-complete`. Manual/historical backups outside this managed set and failed/incomplete bundles are never automatically removed. Retention verifies each resolved target stays directly under the managed directory and excludes symlink targets. Investigate failed bundles and disk space manually. At this stage 14 successful bundles is not a promise of 14 daily recovery points if jobs fail.

The admin page flags a missing/failed backup or a record older than 30 hours. Do not overwrite a failure record just to make the dashboard green. Rerun the real wrapper after resolving the cause.

**Owner boundary: all dumps/uploads remain on the home server.** No Google Drive, PC copy or other off-machine destination is configured. Same-machine snapshots do not protect against complete disk/server loss.

## Recovery and rollback

Follow `OPERATIONS.md` and `OMISE-PAYOUT-SANDBOX.md`: restore only into an empty isolated project, with new data directory and separate loopback port. Keep gateway credentials absent, mutations disabled and reconciliation/worker off during a drill. Verify financial journals, original transfer identity, refund obligations, sessions and file hashes before any traffic switch. Never replay transfers after restoring older history.

Disable only the marked Saan cron block to stop scheduling; preserve all other user jobs. Keep backup bundles and health data during application rollback. Existing payout attempts still require the current GET-only reconciliation implementation; do not downgrade their database history.

## Validation

- `node --conditions=react-server --import tsx --test tests/operations-health.test.ts`
- Linux: `python3 tests/scheduled-backup.test.py deploy/scheduled-backup.py` tests retention and failure behavior in a temporary directory, without Docker or app data.
- Payout regression suite covers bounded fairness without transfer retries. Deployment, final-image PostgreSQL checks, browser proof and actual restore evidence are recorded in `DEPLOYMENT-STATUS.md`.
