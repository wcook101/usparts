#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
DEV_HOST="${DEV_HOST:-192.168.1.153}"

echo "=== USParts production setup (LAN) ==="
echo "App directory: ${APP_DIR}"
echo "Public URL:    http://${DEV_HOST}"
echo

cd "${APP_DIR}"

tar -xf /tmp/usparts-sync.tar 2>/dev/null || true
find scripts deploy -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true

# shellcheck disable=SC1091
source "${APP_DIR}/scripts/lib/server-common.sh"

install_reverse_proxy() {
  if command -v caddy >/dev/null 2>&1; then
    echo "Configuring Caddy..."
    run_sudo mkdir -p /etc/caddy
    run_sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
    run_sudo systemctl enable caddy
    run_sudo systemctl restart caddy
    return
  fi

  if systemctl is-active apache2 >/dev/null 2>&1; then
    echo "Configuring Apache reverse proxy..."
    run_sudo a2enmod proxy proxy_http
    run_sudo cp deploy/apache-usparts.conf /etc/apache2/sites-available/usparts.conf
    run_sudo a2dissite 000-default.conf 2>/dev/null || true
    run_sudo a2ensite usparts.conf
    run_sudo systemctl reload apache2
    return
  fi

  echo "Installing Caddy from apt (universe)..."
  run_sudo apt-get update -qq
  run_sudo apt-get install -y software-properties-common
  run_sudo add-apt-repository -y universe
  run_sudo apt-get update -qq
  run_sudo apt-get install -y caddy
  run_sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
  run_sudo systemctl enable caddy
  run_sudo systemctl restart caddy
}

if [ ! -f package.json ]; then
  echo "package.json not found. Deploy the project first."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Creating .env from .env.production.example..."
  cp .env.production.example .env
else
  echo "Updating existing .env for production..."
  if ! grep -q '^POSTGRES_PASSWORD=' .env; then
    echo 'POSTGRES_PASSWORD=usparts' >> .env
  fi
  if grep -q 'NEXT_PUBLIC_APP_URL=.*:3000' .env; then
    sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL="http://192.168.1.153"|' .env
  fi
  if grep -q '^NODE_ENV=' .env; then
    sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' .env
  else
    echo 'NODE_ENV=production' >> .env
  fi
fi

mkdir -p "${APP_DIR}/logs" /home/bill/usparts-backups

ensure_postgres

if [ -f scripts/rotate-db-password.sh ]; then
  chmod +x scripts/rotate-db-password.sh
  if ! bash scripts/rotate-db-password.sh; then
    echo "Password rotation skipped or failed — checking database connection..."
    if ! npm run db:deploy >/dev/null 2>&1; then
      echo "WARNING: Database credentials may be out of sync. Reset with:"
      echo "  sudo -u postgres psql -c \"ALTER USER usparts WITH PASSWORD 'usparts';\""
    fi
  fi
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

echo "Installing Node dependencies..."
npm install --include=dev

echo "Applying migrations..."
npm run db:deploy

echo "Building production app..."
NODE_ENV=production npm run build

install_reverse_proxy

echo "Installing systemd service..."
run_sudo cp deploy/usparts.service /etc/systemd/system/usparts.service
run_sudo systemctl daemon-reload
run_sudo systemctl enable usparts
run_sudo systemctl restart usparts

echo "Installing health check timer..."
run_sudo cp deploy/usparts-healthcheck.service /etc/systemd/system/
run_sudo cp deploy/usparts-healthcheck.timer /etc/systemd/system/
run_sudo systemctl daemon-reload
run_sudo systemctl enable --now usparts-healthcheck.timer

chmod +x scripts/healthcheck.sh scripts/backup-database.sh scripts/rotate-db-password.sh

if ! crontab -l 2>/dev/null | grep -q 'backup-database.sh'; then
  (crontab -l 2>/dev/null; echo "0 3 * * * cd ${APP_DIR} && ${APP_DIR}/scripts/backup-database.sh >> ${APP_DIR}/logs/backup.log 2>&1") | crontab -
  echo "Scheduled daily database backup at 03:00."
fi

sleep 6
bash scripts/healthcheck.sh

echo
echo "=== Production setup complete ==="
echo "App (internal): http://127.0.0.1:3000"
echo "LAN access:     http://${DEV_HOST}"
echo "Logs:           ${APP_DIR}/logs/app.log"
echo "Health log:     ${APP_DIR}/logs/healthcheck.log"
echo "Backups:        /home/bill/usparts-backups"
