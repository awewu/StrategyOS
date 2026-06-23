---
name: stratos-windows-deploy
description: Package and prepare this StratOS project for Windows Server deployment with PostgreSQL, Prisma db push/seed, optional WorkOS auth, standalone Next.js output, and a clean upload archive. Use when the user asks to build a deployment package, update deployment flow, fix Windows Server deployment scripts, or create database deployment scripts for this repository; do not overwrite server-maintained Nginx configuration unless explicitly requested.
---

# StratOS Windows Deploy

## Purpose

Prepare this repository for manual Windows Server deployment. The expected output is a clean upload package containing runtime files and application deployment scripts only. Keep human deployment notes outside the package. Do not package or overwrite Nginx config unless the user explicitly asks for it.

## Fixed Decisions

- Target server: Windows Server; Nginx is maintained manually by the operator.
- Runtime: Next.js `output: "standalone"` started with `node server.js`.
- App bind: `HOSTNAME=127.0.0.1`, default `PORT=3000`; if Nginx is used, it proxies to this local port.
- Database: PostgreSQL 16+, synchronized with `npx prisma db push`.
- First deploy data: run `npx tsx prisma/seed.ts` unless explicitly skipped.
- Auth: WorkOS is optional during initial deployment. If WorkOS is skipped, write `STRATOS_REQUIRE_AUTH=0` and `STRATOS_SKIP_ENV_VALIDATE=1`.
- Windows scripts must run on Windows PowerShell 5. Avoid APIs such as `RandomNumberGenerator::Fill`; use `RandomNumberGenerator.Create().GetBytes(...)`.
- Seed must be idempotent on an empty database. Create parent records before children and avoid `update()` for records that may not exist; use `upsert()` or ensure placeholders first.
- Upload archive must not contain deployment documentation, Nginx config, local `.env`, dev logs, local uploaded files, `docs`, `deploy`, CI/dev config, or duplicate traced folders such as `public/public`, `prisma/prisma`, `scripts/scripts`.

## Workflow

1. Read current deployment artifacts before changing anything:
   - `next.config.ts`
   - `package.json`
   - `deploy/windows/*`
   - `scripts/package-windows-release.ps1`
   - `prisma/schema.prisma`
   - `prisma/seed.ts`
   - simple deployment guide under `release/` if present
2. Ensure production build exists:
   - Run `npm.cmd install` only when dependencies are missing.
   - Run `npm.cmd run build` before packaging.
3. Keep server scripts in `deploy/windows/scripts`:
   - `Configure-Env.ps1`
   - `Import-Env.ps1`
   - `Init-Database.ps1`
   - `Start-StratOS.ps1`
   - `Stop-StratOS.ps1`
   - `Check-Health.ps1`
   - `Deploy.ps1`
4. Package with `scripts/package-windows-release.ps1`.
5. Create or update the simple deployment note outside the archive when requested.
6. Validate archive contents with `tar -tf` or `tar -tzf`.
7. If server deployment fails, prefer shipping a single fixed file (`prisma/seed.ts`, `scripts/*.ps1`, or `.env.production` instructions) when a full package is unnecessary.

## Required Archive Contents

The upload archive should include:

- `server.js`
- `.next/static`
- `.next/server` and traced standalone runtime files
- `public`, excluding local `public/uploads`
- `prisma/schema.prisma`, migrations, and seed files
- `node_modules` required for runtime plus Prisma/tsx deployment commands
- `scripts/*.ps1` deployment scripts
- `env.production.example`
- `db/create-database-template.sql`
- `package.json` and `package-lock.json`
- `tsconfig.json` because `tsx prisma/seed.ts` needs the `@/*` path alias

It should exclude:

- README or deployment docs
- `.env`, `.env.local`, `.env.production`
- `nginx`, `docs`, `deploy`, `e2e`, `.git`, `.github`, `.cursor`
- Docker, ESLint, Playwright, PostCSS, TypeScript config files
- dev logs such as `stratos-dev.out.log`
- local uploads and duplicate traced folders

## Validation Commands

Use these checks after packaging:

```powershell
tar -tf release\stratos-windows-release-*.zip | Select-String -Pattern "README|deploy-guide|docs/|deploy/|nginx/|Dockerfile|docker-compose|eslint|playwright|postcss|AGENTS|CLAUDE|(^|/)\.env$|stratos-dev|public/public|prisma/prisma|scripts/scripts|public/uploads/.+\.(pdf|docx|xlsx|pptx)"
tar -tf release\stratos-windows-release-*.zip | Select-String -Pattern "^\./server\.js$|^\./tsconfig\.json$|^\./scripts/Deploy\.ps1$|^\./scripts/Configure-Env\.ps1$|^\./scripts/Init-Database\.ps1$|^\./scripts/Start-StratOS\.ps1$|^\./scripts/Stop-StratOS\.ps1$|^\./scripts/Check-Health\.ps1$|^\./env\.production\.example$|^\./db/create-database-template\.sql$|^\./prisma/schema\.prisma$|^\./prisma/seed\.ts$|^\./node_modules/.bin/prisma\.cmd$|^\./node_modules/.bin/tsx\.cmd$"
```

The first command should return nothing relevant except normal dependency paths such as `node_modules/get-tsconfig` or `node_modules/prisma/prisma-client`. The second command must show all required files.

## Reference

Read `references/windows-nginx-flow.md` when the user asks for the deployment procedure, wants the scripts changed, or needs a plain-language operating guide.

## Lessons From Live Deployment

- Missing `tsconfig.json` breaks `npx tsx prisma/seed.ts` with `Cannot find module '@/...'`.
- Windows Server may run PowerShell 5; `RandomNumberGenerator::Fill()` can fail. Use `RandomNumberGenerator.Create().GetBytes(...)`.
- Native commands such as `npx.cmd` do not always throw in Windows PowerShell 5. Wrap them and check `$LASTEXITCODE`, especially for seed.
- If WorkOS is unavailable, skip it deliberately: `STRATOS_REQUIRE_AUTH=0` plus `STRATOS_SKIP_ENV_VALIDATE=1`. Later production SSO can re-enable strict validation.
- Seed ordering matters. `org_units` must exist before users with `orgUnitId`; records such as `competitor_products.smith-hp-ai` must exist before updates.
- Do not keep package staging directories under the repo `release/` folder; Next/Turbopack can type-check stale staged source. Use `%TEMP%` for staging.
- Do not overwrite user-maintained Nginx config. If Nginx guidance is needed, provide a snippet separately and remind the user to restrict by `server_name`/`Host`.
