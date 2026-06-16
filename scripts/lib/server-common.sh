#!/usr/bin/env bash
# Shared helpers for PostgreSQL (Docker or native systemd) and sudo in deploy scripts.

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

run_sudo() {
  if sudo -n true 2>/dev/null; then
    sudo "$@"
    return
  fi

  if [ -n "${SUDO_PASSWORD:-}" ]; then
    echo "${SUDO_PASSWORD}" | sudo -S "$@"
    return
  fi

  sudo "$@"
}

pg_connection_args() {
  PGHOST="${PGHOST:-127.0.0.1}"
  PGUSER="${PGUSER:-usparts}"
  PGDATABASE="${PGDATABASE:-usparts}"
  PGPASSWORD="${POSTGRES_PASSWORD:-usparts}"
  export PGPASSWORD
}

ensure_postgres() {
  if command -v docker >/dev/null 2>&1 && [ -f docker-compose.yml ]; then
    if docker compose ps db 2>/dev/null | grep -q running; then
      echo "PostgreSQL: Docker container already running"
      return 0
    fi

    echo "Starting PostgreSQL via Docker..."
    docker compose up db -d
    return 0
  fi

  if systemctl is-active postgresql >/dev/null 2>&1; then
    echo "PostgreSQL: native service active"
    return 0
  fi

  if systemctl list-unit-files postgresql.service >/dev/null 2>&1; then
    echo "Starting native PostgreSQL..."
    run_sudo systemctl start postgresql
    return 0
  fi

  echo "No PostgreSQL found. Install Docker + docker compose or native postgresql."
  exit 1
}

psql_exec() {
  local sql="$1"
  if command -v docker >/dev/null 2>&1 && docker compose ps db 2>/dev/null | grep -q running; then
    docker compose exec -T db psql -U usparts -d usparts -c "${sql}"
  else
    pg_connection_args
    psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -c "${sql}"
  fi
}

pg_dump_backup() {
  local output="$1"
  if command -v docker >/dev/null 2>&1 && docker compose ps db 2>/dev/null | grep -q running; then
    docker compose exec -T db pg_dump -U usparts usparts | gzip > "${output}"
  else
    pg_connection_args
    pg_dump -h "${PGHOST}" -U "${PGUSER}" "${PGDATABASE}" | gzip > "${output}"
  fi
}
