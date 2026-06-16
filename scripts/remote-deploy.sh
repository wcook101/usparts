#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
cd "${APP_DIR}"

tar -xf /tmp/usparts-sync.tar
rm -f /tmp/usparts-sync.tar

find scripts deploy -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true

# shellcheck disable=SC1091
source "${APP_DIR}/scripts/lib/server-common.sh"

mkdir -p logs

if [ ! -f .env ]; then
  cp .env.production.example .env
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

npm install --include=dev
npm run db:deploy

echo "Building production bundle..."
NODE_ENV=production npm run build

if systemctl list-unit-files usparts.service >/dev/null 2>&1 && systemctl is-enabled usparts >/dev/null 2>&1; then
  echo "Restarting usparts systemd service..."
  run_sudo systemctl restart usparts
  sleep 6
  curl -sf http://127.0.0.1:3000/api/health
  echo
  if systemctl is-active --quiet caddy 2>/dev/null; then
    curl -sf "http://127.0.0.1/api/health" && echo " (via Caddy :80)"
  fi
  tail -5 logs/app.log 2>/dev/null || true
else
  echo "usparts.service not installed — using nohup fallback."
  echo "Run: SUDO_PASSWORD=... bash scripts/setup-production-server.sh"
  pkill -f 'next-server' || pkill -f 'next (dev|start)' || pkill -f 'standalone/server' || true
  sleep 2
  nohup env NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js >> logs/app.log 2>&1 &
  sleep 8
  curl -sf http://127.0.0.1:3000/api/health
  echo
  tail -5 logs/app.log
fi
