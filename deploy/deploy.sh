#!/usr/bin/env bash
set -euo pipefail

# Deprecated: use scripts/setup-dev-server.sh for development.
# This wrapper remains for convenience.

APP_DIR="${APP_DIR:-/opt/usparts}"
cd "${APP_DIR}"
exec ./scripts/setup-dev-server.sh
