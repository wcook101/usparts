#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/bill/usparts}"
DEV_HOST="${DEV_HOST:-192.168.1.153}"

cd "${APP_DIR}"

if [ ! -f .env ]; then
  cp .env.development.example .env
fi

docker compose up db -d
npm run dev
