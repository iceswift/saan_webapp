#!/bin/sh
# Restore into a NEW empty stack. Never erases an existing database or uploads.
set -eu
cd "$(dirname "$0")"
bundle=${1:?Usage: restore.sh ABSOLUTE_BACKUP_DIRECTORY}
case "$bundle" in /*) ;; *) echo 'Use an absolute backup directory' >&2; exit 1;; esac
test "${RESTORE_EMPTY_STACK:-}" = "yes" || { echo 'Set RESTORE_EMPTY_STACK=yes for a new empty target stack' >&2; exit 1; }
(cd "$bundle" && sha256sum -c SHA256SUMS)
test -z "$(sh ./compose.sh ps --status running -q app)" || { echo 'Stop the target app first' >&2; exit 1; }
tables=$(sh ./compose.sh exec -T db psql -U saan -d saan -Atc "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
test "$tables" = 0 || { echo 'Target database is not empty; refusing restore' >&2; exit 1; }
sh ./compose.sh run --rm --no-deps -T app node -e "const fs=require('node:fs'); if(fs.readdirSync('/data/uploads').length)process.exit(1)" || {
  echo 'Target uploads must be empty' >&2; exit 1;
}
sh ./compose.sh exec -T db pg_restore -U saan -d saan --no-owner --no-privileges --exit-on-error < "$bundle/database.dump"
sh ./compose.sh run --rm --no-deps -T app tar -C /data/uploads -xzf - < "$bundle/uploads.tar.gz"
echo 'Restore finished; verify migrations and data, then start app/proxy. Keep the old stack read-only.'
