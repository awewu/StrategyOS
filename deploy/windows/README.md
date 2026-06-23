# StratOS Windows Server Deployment

This package is for Windows Server + Nginx reverse proxy.

## Server prerequisites

- Windows Server 2019+.
- Node.js 20 LTS installed and available in `PATH`.
- PostgreSQL 16+ reachable from this server.
- Nginx for Windows installed.
- WorkOS AuthKit credentials for production SSO.

## First deploy

1. Extract the release zip to a permanent directory, for example:

   `C:\StratOS`

   PowerShell example:

   ```powershell
   New-Item -ItemType Directory -Force C:\StratOS
   Expand-Archive .\stratos-windows-release.zip -DestinationPath C:\StratOS -Force
   ```

2. Open PowerShell as Administrator:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass -Force
   cd C:\StratOS
   .\scripts\Configure-Env.ps1
   .\scripts\Deploy.ps1
   ```

3. Copy or include the generated Nginx config from:

   `C:\StratOS\nginx\stratos.conf`

   into your Nginx `conf\nginx.conf` `http { ... }` block, or include it:

   ```nginx
   include C:/StratOS/nginx/stratos.conf;
   ```

4. Reload Nginx:

   ```powershell
   nginx -s reload
   ```

5. Verify:

   ```powershell
   .\scripts\Check-Health.ps1
   ```

## Required WorkOS settings

In WorkOS Dashboard:

- Redirect URI: `https://your-domain/api/auth/callback`
- Webhook URL: `https://your-domain/api/auth/workos/webhook`
- Webhook events: `dsync.user.created`, `dsync.user.updated`, `dsync.user.deleted`

## Values you must prepare

- Public domain, for example `https://stratos.example.com`.
- PostgreSQL connection string, for example `postgresql://stratos_user:password@127.0.0.1:5432/stratos?connection_limit=10&pool_timeout=10`.
- WorkOS `WORKOS_CLIENT_ID`.
- WorkOS `WORKOS_API_KEY`.
- WorkOS `WORKOS_ORGANIZATION_ID`, recommended.
- WorkOS `WORKOS_WEBHOOK_SECRET`, recommended.
- OpenAI API key, optional.

## Database

The deploy script runs:

```powershell
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

`db push` synchronizes the current Prisma schema to PostgreSQL. Seed can be skipped by setting:

```powershell
$env:STRATOS_SKIP_SEED="1"
```

## Runtime files to preserve

Keep these across upgrades:

- `.env.production`
- `stratos.pid`
- `logs\`
- `public\uploads\`
