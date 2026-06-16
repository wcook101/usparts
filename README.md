# USParts

USParts is an electronic component marketplace where suppliers list available inventory and buyers search for parts to fill production and repair orders.

**Current goal:** run as a **development site** on `192.168.1.153` on your local network. Get everything working there before exposing it on the public internet.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **PostgreSQL** with **Prisma**
- **Tailwind CSS**

## LAN production setup (Phase A)

On `192.168.1.153` the recommended stack is:

| Component | How it runs |
|-----------|-------------|
| PostgreSQL | Docker (`docker compose up db`), localhost only |
| Next.js app | `next build` + `next start` on `127.0.0.1:3000` (systemd) |
| Reverse proxy | Apache (or Caddy) on port **80** → app on `127.0.0.1:3000` |
| Backups | Daily `pg_dump` cron → `/home/bill/usparts-backups` |
| Monitoring | systemd health-check timer every 5 minutes |

### Deploy from Windows

```powershell
# First deploy + one-time production setup (Caddy, systemd, DB password rotation):
.\scripts\deploy-to-dev-server.ps1 -SetupProduction

# Routine deploys after that:
.\scripts\deploy-to-dev-server.ps1
```

Open **http://192.168.1.153** from your LAN.

### Manual setup on the server

```bash
cd /home/bill/usparts
cp .env.production.example .env
bash scripts/setup-production-server.sh
```

This installs Caddy, systemd services, rotates the default DB password, schedules backups, and builds the production app.

### Logs and backups

```bash
tail -f /home/bill/usparts/logs/app.log
tail -f /home/bill/usparts/logs/healthcheck.log
ls /home/bill/usparts-backups
```

## Dev server architecture (legacy hot-reload)

For active development with hot reload, use `npm run dev` instead:

| Component | How it runs |
|-----------|-------------|
| Next.js app | `npm run dev` on port 3000 |
| Network access | `http://192.168.1.153:3000` |

```bash
cp .env.development.example .env
./scripts/setup-dev-server.sh
./scripts/start-dev.sh
```

## Local development (on your PC)

```bash
npm install
cp .env.example .env
npm run dev:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional: keep dev server running after logout

```bash
sudo cp deploy/usparts-dev.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now usparts-dev
```

## Later: production-like test (not for daily dev)

When you want to test a production build before going live:

```bash
./deploy/deploy-full.sh
```

This uses `docker-compose.full.yml` to run the app in a container.

## Before going public on the internet (Phase B)

Phase A (LAN) is handled above. When you have a public domain:

1. Point DNS at your server and update `deploy/Caddyfile` with your hostname (Caddy auto-HTTPS)
2. Configure SMTP in `.env` for real email
3. Add external uptime monitoring (e.g. UptimeRobot)
4. Have legal counsel review `/privacy` and `/terms` stub pages

## API endpoints

- `GET /api/health` — health check
- `GET /api/search?q=STM32` — search listings
- `POST /api/companies` — register a supplier
- `POST /api/listings` — publish inventory
- `GET /api/listings/:id` — fetch a listing
