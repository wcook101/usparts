#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
LOG_FILE="${LOG_FILE:-/home/bill/usparts/logs/healthcheck.log}"
APP_URL="${APP_URL:-http://127.0.0.1:3000}"

mkdir -p "$(dirname "${LOG_FILE}")"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if curl -sf "${APP_URL}/api/health" >/dev/null; then
  echo "${timestamp} OK ${APP_URL}/api/health" >> "${LOG_FILE}"
  exit 0
fi

echo "${timestamp} FAIL ${APP_URL}/api/health" >> "${LOG_FILE}"
exit 1
