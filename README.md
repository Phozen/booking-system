# QBook

[![CI](https://github.com/Phozen/booking-system/actions/workflows/ci.yml/badge.svg)](https://github.com/Phozen/booking-system/actions/workflows/ci.yml)

Internal facility booking for meeting rooms and event spaces. People sign in with Microsoft. Access is allowlisted. There is no public signup.

**Live app:** [booking-system-self-five.vercel.app](https://booking-system-self-five.vercel.app)

The live site is for approved staff. Sign-in needs a Microsoft account on the organisation tenant, plus an active allowlist row.

Booking and access rules run on the server and in the database, not only in the browser.

## What it does

### Employees

- Sign in with Microsoft.
- Browse rooms, photos, capacity, equipment, and availability.
- Create, edit, reschedule, and cancel bookings they are allowed to change.
- Add purpose, headcount, Teams or room-only, catering, departments, and internal invitees.
- Open their bookings, invitations, notifications, profile, and calendar.
- Accept or decline invitations.

### Administrators

- Run bookings, approvals, rooms, equipment, blocked times, maintenance, email queue, reports, and audit logs.
- Create a booking for an active user and set the first participants.
- Export booking, utilisation, cancellation, user, and audit reports as CSV.

### Super Administrators

- Manage allowlisted users, roles, departments, and non-secret settings.
- Review calendar sync status and retries.
- Set whether employees see only their own bookings on the calendar, or every booking.

## Current highlights

- Overlapping active bookings are blocked. A slot that starts when the previous one ends is allowed.
- Approval, catering, and audit history are stored with the booking.
- Department tags stay on historical bookings and can receive booking mail.
- Internal invitations are created with the booking in one database step.
- Room photos stay in private storage and are shown with signed URLs.
- Booking emails include purpose, room, time, status, meeting type, invitees, requester, departments, and catering when those fields exist.
- Optional one-way calendar sync to Microsoft Graph or n8n. It stays off until the external setup is verified.
- Microsoft-only access, backed by Supabase Auth, RLS, policies, and server checks.

Recurring booking tools are retired on purpose. Old recurrence rows stay for audit only.

## Not in this product

- Public self-service registration
- Password login for staff
- Recurring series create or edit
- Two-way Outlook calendar sync
- External guests outside the Microsoft allowlist

## Technology

- Next.js 16 App Router and React 19
- TypeScript, Tailwind CSS, and shadcn/Base UI
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Zod and React Hook Form
- Resend or SMTP for app mail
- Microsoft Graph or n8n calendar providers (optional)
- Vitest and Playwright
- Vercel deploy on push to `main`, plus GitHub Actions CI

## Repository guides

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

Optional email and calendar integrations need their own credentials and admin approval. They are not required for a safe local run.

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
