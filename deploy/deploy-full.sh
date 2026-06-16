#!/usr/bin/env bash
set -euo pipefail

# Use this later when you want to test a production-like build on the dev server.
# For day-to-day development, use scripts/setup-dev-server.sh instead.

APP_DIR="${APP_DIR:-/opt/usparts}"

echo "Starting production-like stack in ${APP_DIR}..."
cd "${APP_DIR}"

docker compose -f docker-compose.full.yml up -d --build
docker compose -f docker-compose.full.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.full.yml exec app npm run db:seed

echo "USParts (production-like) is running at http://192.168.1.153:3000"
