#!/bin/sh
set -eu
cd "$(dirname "$0")"
exec docker compose --env-file deployment.env -f compose.yml "$@"
