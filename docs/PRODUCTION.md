# StratOS · Production Deployment Guide

**Version:** v1.0 · 2026-06-22  
**Audience:** Platform / DevOps · ~30 executive users

---

## Prerequisites

| Item | Requirement |
|------|-------------|
| Node | 20 LTS (build) |
| Database | PostgreSQL 16+ |
| SSO | WorkOS AuthKit (production) |
| TLS | Reverse proxy (nginx / Traefik / cloud LB) in front of app |

Run `npm run preflight -- --http --strict` before first traffic.

---

## Required environment variables

Copy `.env.example` → `.env.prod` and set:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Include `connection_limit=10&pool_timeout=10` |
| `STRATOS_PUBLIC_URL` | Yes | Public HTTPS URL, e.g. `https://stratos.example.com` |
| `STRATOS_REQUIRE_AUTH` | Yes | Must be `1` in production |
| `STRATOS_SESSION_SECRET` | Yes | Min 32 chars — `openssl rand -base64 32` |
| `WORKOS_CLIENT_ID` | Yes | AuthKit client ID |
| `WORKOS_API_KEY` | Yes | Server-side API key |
| `WORKOS_REDIRECT_URI` | Yes | `{STRATOS_PUBLIC_URL}/api/auth/callback` |
| `WORKOS_ORGANIZATION_ID` | Recommended | Restrict login to org |
| `WORKOS_WEBHOOK_SECRET` | Recommended | Directory Sync webhooks |
| `POSTGRES_PASSWORD` | Docker only | Used by `docker-compose.prod.yml` |

Optional: `OPENAI_API_KEY` (LLM Agent), `ORG_UNIT_ID`, `HORIZON_START`, `HORIZON_END`.

Validate locally:

```bash
npm run preflight
# With running server:
STRATOS_BASE_URL=https://stratos.example.com npm run preflight -- --http --strict
```

---

## Docker Compose (recommended)

```bash
# 1. Configure secrets
cp .env.example .env.prod
# Edit POSTGRES_PASSWORD, STRATOS_SESSION_SECRET, WORKOS_*, STRATOS_PUBLIC_URL

# 2. Build and start
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# 3. Apply schema + seed (first deploy)
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app \
  npx prisma db push
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app \
  npx tsx prisma/seed.ts

# 4. Verify
curl -sf "https://stratos.example.com/api/health?format=json&probe=readiness"
```

**Ports:** Container listens on **3000**. Map via `APP_PORT` or reverse proxy.

**Rollback:** `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d` with previous image tag.

---

## Manual Docker image

```bash
docker build -t stratos:latest .
docker run -d --name stratos \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e STRATOS_PUBLIC_URL="https://stratos.example.com" \
  -e STRATOS_REQUIRE_AUTH=1 \
  -e STRATOS_SESSION_SECRET="$(openssl rand -base64 32)" \
  -e WORKOS_CLIENT_ID=client_... \
  -e WORKOS_API_KEY=sk_... \
  -e WORKOS_REDIRECT_URI="https://stratos.example.com/api/auth/callback" \
  stratos:latest
```

---

## Health probes

| Probe | URL | Expected |
|-------|-----|----------|
| **Liveness** | `GET /api/health?format=json` | HTTP 200 (process alive) |
| **Readiness** | `GET /api/health?format=json&probe=readiness` | HTTP 200 when DB connected; **503** when degraded |

Kubernetes example:

```yaml
livenessProbe:
  httpGet:
    path: /api/health?format=json
    port: 3000
  initialDelaySeconds: 30
readinessProbe:
  httpGet:
    path: /api/health?format=json&probe=readiness
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 10
```

---

## Authentication behaviour

When `STRATOS_REQUIRE_AUTH=1` and WorkOS is configured:

- All routes except `/login`, `/api/auth/*`, `/api/health` require a signed session cookie.
- Demo email login is **disabled** (`403` on `/api/auth/login`).
- Role switcher is **hidden** — role comes from WorkOS → Prisma user record.
- Session cookies are HMAC-signed when `STRATOS_SESSION_SECRET` is set.

Boot validation runs via `instrumentation.ts` — missing required env **prevents startup** in `NODE_ENV=production`.

---

## Database backup & restore

**Backup (daily recommended):**

```bash
pg_dump -h localhost -U postgres -d stratos -Fc -f stratos-$(date +%Y%m%d).dump
```

**Restore:**

```bash
pg_restore -h localhost -U postgres -d stratos --clean --if-exists stratos-YYYYMMDD.dump
```

Docker:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres -d stratos -Fc > stratos-backup.dump
```

---

## Permissions (product decision)

| Route | Min level | Roles |
|-------|-----------|-------|
| `/finance`, `/fpa` | L3 | CEO only |
| `/command`, `/inbox` | L3 | CEO only |
| `/strategy/input` | L2 | VP, staff, CEO |
| `/admin/*` | L4 | CEO + staff |

Staff can edit strategy input but **cannot** access FPA finance pages — intentional for ~30-user executive scope.

---

## CI/CD

GitLab pipeline (`.gitlab-ci.yml`): **harness → build → e2e** on `main` and merge requests.

E2E runs against production build (`npm run start`) with Playwright. Harness gate: `npm run harness:ci`.

---

## Post-launch (Phase B — not blocking)

- Command center 12-column layout
- PPT icon inline hex cleanup
- Board Light preview toggle
- Full SCR database persistence
- Mobile rehearsal tablet

See [DELIVERY.md](./DELIVERY.md) and [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md).
