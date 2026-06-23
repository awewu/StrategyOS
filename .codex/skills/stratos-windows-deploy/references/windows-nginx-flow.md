# Windows + Nginx Flow

## Package Flow

1. Build with `npm.cmd run build`.
2. Run `powershell -ExecutionPolicy Bypass -File scripts\package-windows-release.ps1`.
3. Prefer the newest `release\stratos-windows-release-*.zip` for upload.
4. Keep the human deployment note outside the archive.
5. Do not package Nginx config unless the user explicitly asks for it.

## Server Flow

The simple user-facing flow is:

```powershell
New-Item -ItemType Directory -Force C:\StratOS
Expand-Archive .\stratos-windows-release-VERSION.zip -DestinationPath C:\StratOS -Force
cd C:\StratOS
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\Configure-Env.ps1
.\scripts\Deploy.ps1
```

The server operator must prepare:

- Public HTTPS URL.
- PostgreSQL `DATABASE_URL`.
- WorkOS keys only if SSO is enabled now.
- Optional OpenAI API key.

If WorkOS is skipped, `.env.production` must contain:

```env
STRATOS_REQUIRE_AUTH=0
STRATOS_SKIP_ENV_VALIDATE=1
```

## WorkOS Dashboard

Use only when WorkOS SSO is enabled:

```text
Redirect URI:
https://<domain>/api/auth/callback

Webhook URL:
https://<domain>/api/auth/workos/webhook

Webhook events:
dsync.user.created
dsync.user.updated
dsync.user.deleted
```

## Database

If the database/user do not exist, use `db/create-database-template.sql` as a template. Replace the password before executing it as a PostgreSQL superuser.

The deployment script runs:

```powershell
npx.cmd prisma generate
npx.cmd prisma db push
npx.cmd tsx prisma/seed.ts
```

Use `.\scripts\Deploy.ps1 -SkipSeed` for upgrades where seed should not run.

## Nginx

Nginx is maintained manually on this server. Do not overwrite it during application packaging. If asked for a snippet, restrict by host so other services on the same server do not route to StratOS:

```nginx
server {
    listen 80;
    server_name strat.rhautt.com;

    if ($host != "strat.rhautt.com") {
        return 444;
    }

    location / {
        proxy_pass http://127.0.0.1:3050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then test and reload:

```powershell
nginx -t
nginx -s reload
```

## Troubleshooting From First Deployment

- `Cannot find module '@/lib/constants'` during seed means `tsconfig.json` is missing from the package.
- `Foreign key constraint violated` on `User` means org seed did not run before users.
- `Record to update not found` means seed used `update()` on an optional first-run record; change to `upsert()` or create a placeholder.
- `/api/health` returns 500 after successful seed when WorkOS is skipped usually means `.env.production` lacks `STRATOS_SKIP_ENV_VALIDATE=1`.
