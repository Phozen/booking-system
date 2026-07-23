# Architecture

## Overview

QBook is a Next.js App Router application backed by Supabase. The browser handles presentation and form interaction; server components, server actions, route handlers, PostgreSQL functions, Row Level Security (RLS), and database constraints enforce the business rules.

```text
Browser
  -> Next.js pages, server actions, and route handlers
      -> Supabase Auth / Postgres / Storage
      -> optional notification providers (Resend or SMTP)
      -> optional outbound calendar provider (Microsoft Graph or n8n)
```

The application is designed so that a UI check is not the only protection. Critical booking mutations use database RPCs and database-level conflict/authorisation rules.

## Application structure

| Area | Responsibility |
| --- | --- |
| `app/` | App Router pages, layouts, route handlers, and authentication callback |
| `components/` | Reusable UI and role-specific booking/admin views |
| `lib/` | Server actions, queries, validation, email, calendar, and Supabase helpers |
| `config/` | App defaults and shared configuration |
| `supabase/migrations/` | Append-only schema, RLS, functions, policies, and data migrations |
| `tests/` | Vitest unit/repository tests and Playwright browser specifications |
| `.github/workflows/` | CI and controlled production-release workflow |

## Request and identity model

1. Supabase Auth establishes the session.
2. The Next.js proxy refreshes/updates the session for matching application routes.
3. Server-side code creates a Supabase client from request cookies.
4. Authorisation helpers and RLS check the active user, role, record ownership, and allowed transition.
5. Privileged service-role access is isolated in `lib/supabase/admin.ts` and must remain server-only.

The three application roles are:

| Role | Scope |
| --- | --- |
| Employee | Own bookings, invitations, profile, notification preferences, and allowed calendar views |
| Admin | Operational booking, facility, availability, email, reports, and audit activities |
| Super Admin | Admin scope plus user/role management, settings, departments, and integration operations |

Microsoft access is intended to be pre-provisioned and tenant-restricted. The repository contains the enforcement path, while tenant/provider configuration is an external deployment responsibility.

## Booking lifecycle

```text
Create -> pending or confirmed
  pending -> approved/confirmed, rejected, or cancelled
  confirmed -> cancelled, checked in, no-show, or completed
```

Booking creation validates facility availability, time range, capacity-related input, approval rules, catering input, active departments, and active internal invitees. The core `create_booking_with_participants` RPC creates the booking, its department tags, and initial invitations atomically.

PostgreSQL uses a half-open time range (`[start, end)`) and an exclusion constraint for active booking states. This allows a booking ending at 11:00 to be followed by one beginning at 11:00, while blocking overlapping intervals.

Recurring booking creation and operations have been removed. Existing recurrence data remains historical/audit data only.

## Data and storage boundaries

Core domains include:

- profiles and approved users
- facilities, photos, equipment, and facility equipment
- bookings, approvals, invitations, department tags, and usage tracking
- blocked periods and maintenance closures
- email notifications and calendar sync records
- settings, audit logs, and report/export activity

Facility images use the private `facility-photos` Supabase Storage bucket. Read access is presented through signed URLs; management is restricted to administrators.

See [Database schema](DATABASE_SCHEMA.md) for the implementation-oriented model and migration notes.

## Integrations

### Email

Booking and invitation messages enter an application-owned queue. An administrator can process/retry queue items, and protected cron endpoints support reminder queueing and email processing. The canonical combined route is `GET /api/cron/email/run`, authorised with `CRON_SECRET`.

Email delivery can use Resend or SMTP. Provider credentials are server-only and delivery remains safely disabled when the provider is not configured.

### Calendar

The application supports optional one-way, outbound calendar synchronisation for confirmed/cancelled bookings. Provider options are Microsoft Graph and n8n webhooks. Calendar failures are recorded as sync state and do not roll back the booking transaction.

The system does not import external calendar availability or perform two-way calendar sync.

## Operational boundaries

- CI runs dependency auditing, linting, type checking, tests, and a production build.
- The controlled production workflow checks a selected Vercel deployment before promotion.
- Migrations are part of the release boundary. A code deployment must not assume a schema change exists until it is applied to the target Supabase project.
- External provider readiness is not inferred from repository code. It requires environment-specific evidence.

<!-- VERIFY: Confirm the target environment's Auth Hook, Microsoft tenant policy, storage policies, provider credentials, and release protection before relying on them in a proposal or launch decision. -->
