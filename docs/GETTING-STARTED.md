# Getting Started

This guide prepares a safe local development environment. It does not configure a production tenant, send production email, or enable live calendar sync.

## 1. Install dependencies

Use Node.js 22.x, then install from the lockfile:

```powershell
npm.cmd ci
```

## 2. Create local configuration

```powershell
Copy-Item .env.example .env.local
```

Set these variables with values from a development Supabase project:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_TIMEZONE=Asia/Kuala_Lumpur
```

Leave email, Microsoft Graph, and n8n variables blank or disabled until they are intentionally tested. See [Configuration](CONFIGURATION.md).

## 3. Prepare Supabase

Link the intended development project and inspect its migration state:

```powershell
npm.cmd exec supabase -- migration list
```

Apply all local migrations only to the intended development project:

```powershell
npm.cmd exec supabase db push
```

Migrations are append-only. Do not edit previously applied migration files to “fix” a database; create a new migration for every schema correction.

## 4. Configure local access deliberately

QBook is designed for Microsoft-backed, pre-provisioned access. A usable development environment needs the corresponding Supabase/Auth setup and an active allowlisted user. Do not enable public email/password, signup, or magic-link access merely to bypass the intended access model.

For a fresh environment, use the approved bootstrap procedure in [Deployment](DEPLOYMENT.md) and [Production checklist](PRODUCTION_CHECKLIST.md). The bootstrap requires an authorised operator because it changes identity/access records.

## 5. Run the application

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`. Missing public Supabase variables fail fast so configuration errors are visible rather than silently using an unintended project.

## 6. Make a safe first change

1. Read the nearest existing component, action, query, migration, and test.
2. Keep validation and authorisation in server/database code, not only in the UI.
3. Add or update the closest test when behaviour changes.
4. Run the smallest relevant check. See [Testing](TESTING.md).
5. Do not include `.env.local`, browser storage states, or credentials in the change.

## Optional local capabilities

| Capability | Local requirement |
| --- | --- |
| Facility photos | Private `facility-photos` bucket and matching storage policies |
| Email delivery | A deliberately configured Resend or SMTP test provider |
| Cron route | `CRON_SECRET` and a manual, authorised request |
| Microsoft calendar | Test tenant/app registration and server-only provider configuration |
| n8n calendar | Test webhook endpoints and server-only shared secret |
| Browser E2E | Playwright Chromium plus dedicated, ignored role storage states |

Do not point local experimentation at production accounts or use production bearer credentials in browser tests.
