#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
BACKUP_DIR="${BACKUP_DIR:-/home/bill/usparts-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

cd "${APP_DIR}"
# shellcheck disable=SC1091
source "${APP_DIR}/scripts/lib/server-common.sh"

if [ ! -f .env ]; then
  echo "Missing .env in ${APP_DIR}"
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

mkdir -p "${BACKUP_DIR}"
timestamp="$(date +%Y%m%d-%H%M%S)"
output="${BACKUP_DIR}/usparts-${timestamp}.sql.gz"

echo "Backing up database to ${output}..."
pg_dump_backup "${output}"

find "${BACKUP_DIR}" -name 'usparts-*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "Backup complete. Retention: ${RETENTION_DAYS} days."
