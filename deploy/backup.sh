#!/bin/sh
# Stops only Saan writes briefly. Keeps database + uploads from the same quiet interval.
set -eu
umask 077
cd "$(dirname "$0")"
destination=${1:?Usage: backup.sh ABSOLUTE_BACKUP_DIRECTORY}
case "$destination" in /*) ;; *) echo 'Use an absolute backup directory' >&2; exit 1;; esac
mkdir -p "$destination"
destination=$(cd "$destination" && pwd)
bundle="$destination/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir "$bundle"
was_running=$(sh ./compose.sh ps --status running -q app)
worker_running=$(sh ./compose.sh --profile payments ps --status running -q payment-worker)
restart() {
  if [ -n "$was_running" ]; then sh ./compose.sh start app >/dev/null; fi
  if [ -n "$worker_running" ]; then sh ./compose.sh --profile payments start payment-worker >/dev/null; fi
}
trap restart EXIT
sh ./compose.sh --profile payments stop payment-worker
sh ./compose.sh stop app
sh ./compose.sh exec -T db pg_dump -U saan -d saan -Fc > "$bundle/database.dump"
# Read the mounted upload directory through the app image, independent of the host path.
sh ./compose.sh run --rm --no-deps -T app tar -C /data/uploads -czf - . > "$bundle/uploads.tar.gz"
sh ./compose.sh images --format json > "$bundle/images.json"
printf '%s\n' 'format=1' 'database=PostgreSQL16' 'credentials=excluded' > "$bundle/manifest.txt"
(cd "$bundle" && sha256sum database.dump uploads.tar.gz images.json manifest.txt > SHA256SUMS)
printf 'Backup complete: %s\n' "$bundle"
