#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
DEV_HOST="${DEV_HOST:-192.168.1.153}"

echo "=== USParts dev server setup ==="
echo "Target directory: ${APP_DIR}"
echo "Dev URL: http://${DEV_HOST}:3000"
echo

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker before continuing."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 22+ before continuing."
  exit 1
fi

NODE_VERSION="$(node -p "process.versions.node.split('.')[0]")"
if [ "${NODE_VERSION}" -lt 20 ]; then
  echo "Node.js 20+ is required. Found: $(node -v)"
  exit 1
fi

mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

if [ ! -f package.json ]; then
  echo "package.json not found in ${APP_DIR}."
  echo "Copy the project here first, then rerun this script."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Creating .env from .env.development.example..."
  cp .env.development.example .env
fi

echo "Starting PostgreSQL (localhost only, not exposed to the internet)..."
docker compose up db -d

echo "Installing dependencies..."
npm install

echo "Applying database migrations..."
npm run db:deploy

echo "Seeding sample data..."
npm run db:seed

echo
echo "=== Setup complete ==="
echo
echo "Start the dev server with:"
echo "  cd ${APP_DIR} && npm run dev"
echo
echo "Then open:"
echo "  http://${DEV_HOST}:3000"
echo
echo "From your PC on the same network:"
echo "  http://${DEV_HOST}:3000"
echo
echo "Verify with:"
echo "  npm run verify"
echo
echo "This is a development setup only. Do not expose port 3000 to the public internet yet."
