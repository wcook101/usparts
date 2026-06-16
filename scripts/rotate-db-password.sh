#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
ENV_FILE="${APP_DIR}/.env"

cd "${APP_DIR}"
# shellcheck disable=SC1091
source "${APP_DIR}/scripts/lib/server-common.sh"

if [ ! -f .env ]; then
  echo "Missing .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

current_password="${POSTGRES_PASSWORD:-usparts}"

ensure_postgres
pg_connection_args

if psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -c "SELECT 1" >/dev/null 2>&1; then
  if [ "${current_password}" != "usparts" ]; then
    echo "Database connection OK with configured password. Skipping rotation."
    exit 0
  fi
else
  echo "Cannot connect with configured password."
  if [ "${current_password}" != "usparts" ]; then
    echo "DATABASE_URL and POSTGRES_PASSWORD may be out of sync with PostgreSQL."
    exit 1
  fi
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate a password."
  exit 1
fi

new_password="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
echo "Rotating database password from default..."

psql_exec "ALTER USER usparts WITH PASSWORD '${new_password}';"

tmp="$(mktemp)"
found_password=false
found_url=false

while IFS= read -r line || [ -n "${line}" ]; do
  if [[ "${line}" == POSTGRES_PASSWORD=* ]]; then
    echo "POSTGRES_PASSWORD=${new_password}"
    found_password=true
  elif [[ "${line}" == DATABASE_URL=* ]]; then
    echo "DATABASE_URL=\"postgresql://usparts:${new_password}@127.0.0.1:5432/usparts?schema=public\""
    found_url=true
  else
    echo "${line}"
  fi
done < "${ENV_FILE}" > "${tmp}"

if [ "${found_password}" = false ]; then
  echo "POSTGRES_PASSWORD=${new_password}" >> "${tmp}"
fi

if [ "${found_url}" = false ]; then
  echo "DATABASE_URL=\"postgresql://usparts:${new_password}@127.0.0.1:5432/usparts?schema=public\"" >> "${tmp}"
fi

mv "${tmp}" "${ENV_FILE}"

echo "Database password rotated and .env updated."
