#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
cd "${APP_DIR}"
# shellcheck disable=SC1091
source "${APP_DIR}/scripts/lib/server-common.sh"

pkill -f 'next-server' || true
pkill -f 'standalone/server' || true
sleep 2

if systemctl is-active apache2 >/dev/null 2>&1; then
  echo "Configuring Apache reverse proxy..."
  run_sudo a2enmod proxy proxy_http
  run_sudo cp deploy/apache-usparts.conf /etc/apache2/sites-available/usparts.conf
  run_sudo a2dissite 000-default.conf 2>/dev/null || true
  run_sudo a2ensite usparts.conf
  run_sudo systemctl reload apache2
fi

run_sudo cp deploy/usparts.service /etc/systemd/system/usparts.service
run_sudo cp deploy/usparts-healthcheck.service /etc/systemd/system/
run_sudo cp deploy/usparts-healthcheck.timer /etc/systemd/system/
run_sudo systemctl daemon-reload
run_sudo systemctl enable usparts
run_sudo systemctl restart usparts
run_sudo systemctl enable --now usparts-healthcheck.timer

chmod +x scripts/healthcheck.sh scripts/backup-database.sh

sleep 5
systemctl is-active usparts apache2
curl -sf http://127.0.0.1/api/health
echo
