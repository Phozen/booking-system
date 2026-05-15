# Booking System

Internal company facility booking system built with Next.js, Supabase, and Resend/SMTP-ready email notifications.

The app lets employees browse facilities, create bookings, manage their own bookings, respond to invitations, and view calendars. Admins manage daily booking operations, facilities, approvals, availability blocks, maintenance closures, reports, audit logs, email notifications, and facility photos. Super Admins have full system-owner access, including user/role management and system settings.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, Postgres, RLS, and Storage
- Tailwind CSS and shadcn/ui-style components
- Resend or SMTP-ready email notification queue
- Microsoft 365 Calendar one-way outbound sync support
- Vitest for unit tests
- Vercel for deployment

## Main Features

### Employee Features

- Email/password login, registration, and password reset.
- Employee dashboard with quick actions and upcoming booking preview.
- Facility browsing and facility detail pages with photos, equipment, capacity, approval requirements, and booking CTA.
- Booking creation with timezone-aware date/time handling, conflict prevention, blocked-period checks, maintenance checks, and approval-aware status.
- My Bookings grouped by pending, upcoming, history, and cancelled.
- Booking detail with cancellation flow and attendee invitations.
- Invitations page for accepting or declining internal booking invitations.
- Calendar page for owned and invited bookings, with optional all-company visibility controlled by admin settings.
- Profile page for editing safe self-service fields: full name, department, and phone.
- Light/dark theme toggle.

### Admin Features

- Admin dashboard for operational overview.
- Facility CRUD-style management:
  - Create facilities.
  - Update facility details, status, approval behavior, equipment metadata, and photos.
  - Archive facilities instead of hard-deleting them, preserving historical bookings and reports.
  - Upload, set primary, and delete facility photos through Supabase Storage.
- Booking management:
  - View all bookings.
  - Filter by status/facility.
  - Approve, reject, or cancel bookings where allowed.
  - View attendee invitations.
- Availability management:
  - Create, update, and deactivate blocked dates.
  - Create, update, complete, and cancel maintenance closures.
- Email notification queue:
  - View queued/sent/failed notifications.
  - Process queued notifications.
  - Retry failed notifications.
- Reports and CSV exports:
  - Booking history.
  - Facility utilization.
  - User booking summary.
  - Cancelled bookings.
  - Audit logs.
- Audit log search and detail views.
### Super Admin Features

- All admin operational features.
- User management:
  - Search and filter users.
  - Update role, status, and safe profile fields.
  - Promote users to Admin or Super Admin.
  - Prevent unsafe self-disable and final-super-admin removal flows.
- System settings:
  - App name, company name, contact email.
  - Registration and allowed email domains.
  - Approval defaults and facility override setting.
  - Timezone and reminder offsets.
  - Employee calendar visibility mode.
- Integration groundwork:
  - Microsoft 365 Calendar sync status and retry page.
  - Server-side Microsoft Graph configuration through environment variables.

## CRUD And Operations Summary

| Area | Employee | Admin |
| --- | --- | --- |
| Facilities | Read active non-archived facilities | Create, read, update, archive, manage photos |
| Facility photos | Read through facility pages | Upload, set primary, delete |
| Bookings | Create own, read own/invited, cancel own eligible bookings | Read all, approve, reject, cancel |
| Invitations | Invite users to own bookings, accept/decline own invitations | View attendee status on booking detail |
| Calendar | View own/invited bookings; optionally view limited all-company bookings | View all bookings or own bookings |
| Users/profiles | Read/update own safe profile fields | Super Admin only: read/search/update users, roles, statuses, safe profile fields |
| Blocked dates | Read active availability impact indirectly through booking validation | Create, read, update, deactivate |
| Maintenance closures | Read active availability impact indirectly through booking validation | Create, read, update, complete, cancel |
| Email notifications | No direct access | Read, process queued, retry failed |
| Reports/exports | No direct access | Read reports, export CSV |
| Audit logs | No direct access | Read and filter |
| Settings | No direct access | Super Admin only: read/update non-secret system settings |
| Microsoft 365 calendar sync | No direct access | Super Admin only: view sync status and retry |

## Key Routes

### Public And Auth

- `/`
- `/login`
- `/register`
- `/reset-password`

### Employee

- `/dashboard`
- `/facilities`
- `/facilities/[slug]`
- `/bookings/new`
- `/bookings/[id]`
- `/my-bookings`
- `/calendar`
- `/invitations`
- `/profile`

### Admin

- `/admin/dashboard`
- `/admin/users`
- `/admin/facilities`
- `/admin/bookings`
- `/admin/approvals`
- `/admin/calendar`
- `/admin/blocked-dates`
- `/admin/maintenance`
- `/admin/email-notifications`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/integrations/microsoft-calendar`
- `/admin/settings`

## Local Development

### Prerequisites

- Node.js 22.x
- npm
- Supabase CLI, if applying or inspecting migrations locally
- A Supabase project for auth, database, and storage

### Install

```bash
npm install
```

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

On Windows PowerShell, copy the file manually or run:

```powershell
Copy-Item .env.example .env.local
```

Required local variables:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_TIMEZONE=Asia/Kuala_Lumpur
APP_NAME=Booking System
COMPANY_NAME=
SYSTEM_CONTACT_EMAIL=
EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_REQUIRE_TLS=
SMTP_USER=
SMTP_PASSWORD=
MICROSOFT_365_CALENDAR_SYNC_ENABLED=false
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_DEFAULT_CALENDAR_ID=
MICROSOFT_SYNC_MODE=disabled
MICROSOFT_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0
```

Security notes:

- `NEXT_PUBLIC_*` values are browser-exposed.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be used in client components.
- `EMAIL_API_KEY` is server-only and used by Resend.
- `SMTP_PASSWORD` is server-only and used by the SMTP provider.
- `MICROSOFT_CLIENT_SECRET` is server-only and will be used by the future Microsoft Graph Calendar sync.
- Real secrets belong in `.env.local` locally and the Vercel dashboard in production. Do not commit them.
- `EMAIL_PROVIDER` can be blank, `none`, `resend`, or `smtp`.
- Email variables can stay blank until a provider is configured. Email processing will fail safely with a configuration message.
- Microsoft 365 SMTP commonly uses `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_REQUIRE_TLS=true`, and a dedicated service mailbox.
- Microsoft 365 Calendar sync uses Microsoft Graph, not SMTP. Keep `MICROSOFT_365_CALENDAR_SYNC_ENABLED=false` until Microsoft Entra values are configured and the integration is ready to test.

### Database Setup

Apply Supabase migrations through the latest migration in `supabase/migrations`.

Current migration set:

```txt
0001_extensions.sql
0002_enums.sql
0003_core_tables.sql
0004_indexes.sql
0005_functions_triggers.sql
0006_rls_policies.sql
0007_seed_data.sql
0008_storage_notes.sql
0009_security_hardening.sql
0010_booking_invitations.sql
0011_fix_booking_invitation_rls_recursion.sql
0012_calendar_visibility_setting.sql
0013_split_admin_roles.sql
0014_microsoft_calendar_sync_groundwork.sql
```

Typical commands:

```powershell
npx.cmd supabase migration list
npx.cmd supabase db push
```

See `docs/DATABASE_SCHEMA.md` for the full schema and RLS model.

### Storage Setup

The app expects a private Supabase Storage bucket:

```txt
facility-photos
```

Expected behavior:

- Active users can read facility photos.
- Active admins can upload, update, and delete facility photos.
- Uploads allow JPEG, PNG, and WebP.
- App-side upload limit is 5 MB.
- Signed URLs are generated server-side for private photo display.

See `docs/STORAGE_SETUP.md` for full bucket setup and manual verification.

### First Super Admin Setup

After the first user registers, promote that profile in Supabase SQL Editor:

```sql
update public.profiles
set role = 'super_admin', status = 'active'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

After that, use `/admin/users` for everyday role and status management. Use `admin` for operational staff and `super_admin` for system owners.

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

Run the full verification stack before handoff or deployment:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run qa
```

The `qa` script runs lint, tests, and production build. Run `typecheck` separately.

Playwright browser smoke tests are available separately:

```bash
npm run e2e
npm run e2e:ui
npm run e2e:headed
```

Install browsers first with `npx playwright install chromium`. Authenticated E2E tests require dedicated test users and `E2E_*` environment variables. See `docs/E2E_TESTING.md`.

## Deployment

Current deployment target is Vercel.

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: Vercel default
- Node.js: 22.x
- Static export: do not enable

Required Vercel environment variables:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_TIMEZONE
APP_NAME
COMPANY_NAME
SYSTEM_CONTACT_EMAIL
EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_REQUIRE_TLS
SMTP_USER
SMTP_PASSWORD
MICROSOFT_365_CALENDAR_SYNC_ENABLED
MICROSOFT_TENANT_ID
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_DEFAULT_CALENDAR_ID
MICROSOFT_SYNC_MODE
MICROSOFT_GRAPH_BASE_URL
```

Supabase Auth should include redirect URLs for:

```txt
http://localhost:3000/**
https://your-vercel-app.vercel.app/**
```

Add future custom-domain URLs when a domain is ready.

See `docs/DEPLOYMENT_NOTES.md` and `docs/PRODUCTION_CHECKLIST.md` for environment variables, Supabase setup, first-admin promotion, storage checks, smoke tests, and rollback notes.

App notification emails, Supabase Auth emails, and Microsoft 365 Calendar sync are separate systems. Booking and invitation notifications use the app queue with `EMAIL_PROVIDER=resend` or `EMAIL_PROVIDER=smtp`. Signup confirmation, password reset, and email-change messages are Supabase Auth emails and must be configured in the Supabase Dashboard if custom SMTP branding is required there. Microsoft 365 Calendar sync uses Microsoft Graph environment variables and should remain disabled until Microsoft Entra app registration and the central calendar target are ready.

## Security Model

- Supabase Auth handles identity.
- `public.profiles` stores app role and status.
- Active employee/admin/super-admin status is required for protected areas.
- Employees cannot access `/admin/*`.
- Employees can manage only their own bookings and invitations.
- Employee all-company calendar visibility is settings-gated and shows limited details for unrelated bookings.
- Operational admin pages require active `admin` or `super_admin` authorization.
- `/admin/users` and `/admin/settings` require active `super_admin` authorization.
- Supabase RLS remains enabled on application tables.
- Critical actions create audit logs where applicable.
- Booking creation uses database-backed conflict prevention to protect against race conditions.

## Documentation Map

- `docs/REQUIREMENTS.md` - product requirements and accepted scope.
- `docs/USER_FLOWS.md` - user journeys and role flows.
- `docs/DATABASE_SCHEMA.md` - schema, constraints, functions, RLS, and storage notes.
- `docs/FRONTEND_UX_SPEC.md` - UI/UX behavior, accessibility, responsive, and theme guidance.
- `docs/SECURITY_CHECKLIST.md` - security and access-control checklist.
- `docs/QA_CHECKLIST.md` - manual and automated QA checklist.
- `docs/DEPLOYMENT_NOTES.md` - Vercel, Supabase, email, domain, and production notes.
- `docs/PRODUCTION_CHECKLIST.md` - pre-launch checklist.
- `docs/STORAGE_SETUP.md` - facility photo storage setup.
- `docs/E2E_TESTING.md` - Playwright setup, credentials, and browser smoke-test strategy.
- `docs/MICROSOFT_365_CALENDAR_SYNC.md` - Microsoft 365 Calendar sync architecture, setup, security, and Stage 2 plan.

## Deferred Or Optional Items

- Real email sending requires Resend or SMTP configuration and a verified sender/mailbox.
- Automatic email cron/background processing is deferred.
- Advanced facility photo UX such as cropping, compression, drag-and-drop, and bulk upload is deferred.
- Recurring bookings are deferred.
- External guest invitations are deferred.
- Inbound, two-way, delegated OAuth, facility-calendar mapping, Teams meeting creation, and personal-calendar Microsoft 365 sync are deferred.
- Network-layer internal access protection, such as Vercel protection or Cloudflare Access, is an optional deployment hardening step.
