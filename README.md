# QBook

QBook is an internal facility-booking system for organisations that need controlled booking of meeting rooms and event spaces. It is built with Next.js, Supabase, and optional email and calendar integrations.

The application enforces the booking and access rules at the server and database layers. It is intended for a Microsoft-managed internal workforce, not public self-service registration.

## What it does

### Employees

- Sign in through the approved Microsoft/Supabase access flow.
- Browse active facilities, their photos, capacity, equipment, and availability.
- Create, edit, reschedule, and cancel eligible bookings.
- Include attendee count, catering details, involved departments, and initial internal invitees.
- View personal bookings, invitations, notifications, notification preferences, profile details, and calendar entries.
- Accept or decline booking invitations.

### Administrators

- Run operational dashboards, bookings, approvals, facilities, equipment, blocked periods, maintenance, email queues, reports, audit logs, and availability controls.
- Create bookings on behalf of active users and manage initial participants.
- Export booking, utilisation, cancellation, user, and audit-log reports as CSV.

### Super Administrators

- Manage active allowlisted users, roles, system settings, departments, and integration status/retries.
- Configure the application’s operational settings without exposing provider credentials.

## Current feature highlights

- Database-backed prevention of overlapping active bookings, with back-to-back slots permitted.
- Approval-aware booking lifecycle, audit logging, check-in/no-show tracking, and catering records.
- Normalised department tags that remain visible on historical bookings and can receive booking notifications.
- Internal attendee invitations created atomically with a booking.
- Private facility-photo storage with signed URL display and admin-only upload management.
- Notification queue with protected reminder/processing routes and health reporting.
- Optional one-way outbound Microsoft Graph or n8n calendar sync. It is disabled until its external configuration is verified.
- Microsoft-only, pre-provisioned access controls backed by Supabase Auth, RLS, policies, and server-side checks.

Recurring booking operations are intentionally retired. Historical recurrence data remains for audit purposes, but the application no longer offers recurring-booking creation or management.

## Technology

- Next.js 16 App Router and React 19
- TypeScript, Tailwind CSS, and component primitives
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Zod and React Hook Form
- Resend or SMTP for app notification delivery
- Microsoft Graph or n8n webhook calendar providers (optional)
- Vitest and Playwright
- Vercel deployment configuration and GitHub Actions CI

## Repository guides

Start here when evaluating or operating the system:

| Guide | Purpose |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Application boundaries, roles, data flow, and integrations |
| [Getting started](docs/GETTING-STARTED.md) | Local setup and first safe run |
| [Development](docs/DEVELOPMENT.md) | Development conventions and change workflow |
| [Testing](docs/TESTING.md) | Unit, integration, browser, and release checks |
| [Configuration](docs/CONFIGURATION.md) | Environment variables and secret-handling rules |
| [API reference](docs/API.md) | HTTP endpoints exposed by the application |
| [Deployment](docs/DEPLOYMENT.md) | Release, migration, rollback, and evidence checklist |
| [Database schema](docs/DATABASE_SCHEMA.md) | Current data model and access-control overview |
| [User flows](docs/USER_FLOWS.md) | Role-based behaviour and booking lifecycle |
| [Security](SECURITY.md) | Vulnerability reporting and security policy |

Operational runbooks such as [email operations](docs/EMAIL_OPERATIONS.md), [Microsoft 365 calendar sync](docs/MICROSOFT_365_CALENDAR_SYNC.md), [backup and restore](docs/BACKUP_RESTORE.md), and the [production ownership runbook](docs/PRODUCTION_OWNERSHIP_RUNBOOK.md) remain the authoritative procedures for those areas.

## Prerequisites

- Node.js 22.x
- npm
- A Supabase project for Auth, database, and Storage
- Supabase CLI for migration work

Optional integrations require their own provider credentials and administrator approval; they are not required for a safe local development run.

## Quick start

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Set at least these values in `.env.local` before opening the app:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply the repository’s Supabase migrations to a development project before exercising data-dependent flows:

```powershell
npm.cmd exec supabase -- migration list
npm.cmd exec supabase db push
```

Follow [Getting started](docs/GETTING-STARTED.md) for the full safe setup order and initial Super Admin bootstrap requirements.

## Common commands

```powershell
npm.cmd run dev          # Development server
npm.cmd run lint         # ESLint
npm.cmd run typecheck    # TypeScript check
npm.cmd test             # Vitest suite
npm.cmd run build        # Production build
npm.cmd run e2e          # Playwright suite
npm.cmd run secret-scan  # Working-tree secret scan
```

`npm run qa` runs lint, tests, and a production build. It is useful before a release but is not a substitute for authenticated browser UAT or production integration checks.

## Security and deployment posture

- Never commit `.env.local`, browser storage state, access tokens, service-role keys, SMTP passwords, or provider client secrets.
- `NEXT_PUBLIC_*` variables are intentionally browser-visible. All other secrets must remain server-only.
- Production migrations are append-only. Apply new SQL through an approved release; do not alter applied migrations.
- External configuration—Microsoft tenant policy, Vercel secrets, Supabase Auth settings, email sender verification, and calendar permissions—must be validated by the owning administrator before the corresponding capability is enabled.

<!-- VERIFY: Confirm the target Supabase project has every migration in supabase/migrations applied before a production release. -->
<!-- VERIFY: Confirm Vercel, Supabase Auth, Microsoft tenant, email, and calendar settings against the environment being proposed. -->
