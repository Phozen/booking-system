# External Integrations

**Analysis Date:** 2026-07-15

## APIs & External Services

**Backend platform:**
- Supabase - Authentication, PostgreSQL, Row Level Security, Storage, and database RPCs.
  - SDK/client: `@supabase/supabase-js` and `@supabase/ssr`.
  - Browser client: `lib/supabase/client.ts` using public URL and anon key.
  - Server session client: `lib/supabase/server.ts` using Next.js cookies.
  - Request Proxy client: `lib/supabase/middleware.ts` refreshes auth cookies and performs optimistic redirects.
  - Privileged client: `lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS, and is protected by `server-only`.

**Email delivery:**
- Resend - Transactional booking/invitation/reminder email delivery through `resend` in `lib/email/provider.ts`.
  - Auth: `EMAIL_API_KEY`; sender: `EMAIL_FROM`; selector: `EMAIL_PROVIDER=resend`.
- SMTP - Alternative delivery through Nodemailer in `lib/email/providers/smtp.ts`.
  - Auth/config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, and `SMTP_PASSWORD`; selector: `EMAIL_PROVIDER=smtp`.
- Email queue - Durable records in `email_notifications`; claiming and status transitions use RPCs from `supabase/migrations/0024_email_queue_claiming.sql` and orchestration in `lib/email/queue.ts`.
- Scheduling - Protected GET handlers at `app/api/cron/email/process/route.ts` and `app/api/cron/email/reminders/route.ts` require `Authorization: Bearer ${CRON_SECRET}`.

**Microsoft identity and calendar:**
- Supabase Azure OAuth - Microsoft login and calendar consent start in `lib/auth/actions.ts`; authorization-code exchange occurs at `app/auth/callback/route.ts`.
  - Scopes include OpenID profile/email plus `offline_access`, `User.Read`, and `Calendars.ReadWrite`.
  - Supabase holds the identity session; delegated calendar tokens are separately encrypted before database storage.
- Microsoft Entra ID token endpoint - App-only client credentials are requested in `lib/integrations/microsoft-365-calendar/auth.ts`.
  - Auth: `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET`.
- Microsoft Graph Calendar - One-way create/update/delete sync in `lib/integrations/microsoft-365-calendar/sync.ts` and `client.ts`.
  - Provider selector: `CALENDAR_SYNC_PROVIDER=microsoft_graph` and `MICROSOFT_365_CALENDAR_SYNC_ENABLED`.
  - Modes: central calendar, booking-owner calendar, and facility calendars are modeled in `config.ts`; current target resolution is implemented by the sync layer.
  - Auth modes: app-only or delegated. Delegated access/refresh tokens are AES-256-GCM encrypted in `delegated.ts` with `MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY`.
  - Sync state and retry metadata live in `booking_calendar_syncs`; user connections live in `microsoft_calendar_connections`.

**Automation bridge:**
- n8n - Optional outgoing calendar lifecycle webhooks in `lib/integrations/microsoft-365-calendar/n8n-webhook.ts`.
  - Provider selector: `CALENDAR_SYNC_PROVIDER=n8n_webhook` and `N8N_CALENDAR_SYNC_ENABLED`.
  - Endpoints: create is required; update and delete enable full lifecycle mode.
  - Auth: `x-booking-system-secret` header from `N8N_CALENDAR_WEBHOOK_SECRET`.
  - Responses must be JSON and explicitly confirm success plus an external event ID.

## Data Storage

**Databases:**
- Supabase PostgreSQL - Primary system of record.
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` plus anon or service-role key depending on trust boundary.
  - Client: Supabase query builder; there is no ORM or generated database type file.
  - Schema: 30 ordered migrations in `supabase/migrations/` define roles, facilities, bookings, approvals, availability blocks, maintenance, invitations, recurrence, notifications, audit/export logs, settings, and calendar integrations.
  - Integrity: RLS policies, exclusion/index support, triggers, and transaction-oriented booking RPCs (`create_booking`, `update_own_booking`, `admin_create_booking`, `create_recurring_booking_series`).
  - Retired data: `supabase/migrations/0030_retire_unused_scheduling_requests.sql` preserves historical scheduling requests while revoking application access.

**File Storage:**
- Supabase Storage - Private `facility-photos` bucket.
  - Upload/delete: privileged server actions in `lib/admin/facilities/photo-actions.ts`.
  - Read: signed URLs generated in `lib/facilities/queries.ts`.
  - Validation: MIME/type/path rules in `lib/admin/facilities/photo-validation.ts`.
  - Policies/setup notes: `supabase/migrations/0008_storage_notes.sql` and `docs/STORAGE_SETUP.md`.
- Local `public/` - Static company logo, login background, favicon, and framework placeholder assets.

**Caching:**
- No Redis, CDN data cache, or application cache service is detected.
- Next.js data cache is not explicitly enabled; authenticated layouts/pages commonly export `dynamic = "force-dynamic"`.
- Microsoft app-only access tokens use a process-local module cache in `lib/integrations/microsoft-365-calendar/auth.ts`; it is opportunistic and not shared across Vercel instances.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth.
  - Email/password sign-in, self-registration, password reset, and logout use Server Actions in `lib/auth/actions.ts`.
  - Microsoft OAuth uses Supabase provider `azure` and the callback Route Handler at `app/auth/callback/route.ts`.
  - Session verification uses `supabase.auth.getUser()` in `lib/auth/session.ts`, then loads the application profile/role from `profiles`.
  - Roles are `employee`, `admin`, and `super_admin` (`lib/auth/profile.ts`, `supabase/migrations/0013_split_admin_roles.sql`).
  - Route/UI guards are `requireUser`, `requireAdmin`, and `requireSuperAdmin` in `lib/auth/guards.ts`.
  - Database authorization is independently enforced by RLS and security-definer helpers/RPCs in `supabase/migrations/`.

**Access boundary:**
- `proxy.ts`/`lib/supabase/middleware.ts` refresh sessions and perform early path redirects, but secure authorization remains in pages, Server Actions, Route Handlers, RLS, and booking RPCs.
- Super Admin-only areas include users, system settings, system health, and calendar integration retry/status routes.

## Monitoring & Observability

**Error Tracking:**
- No Sentry, OpenTelemetry exporter, or external application performance monitoring SDK is detected.

**Logs:**
- Server code uses structured `console.error` objects with identifiers and sanitized provider errors (`lib/bookings/actions.ts`, `lib/email/queue.ts`, `lib/integrations/microsoft-365-calendar/errors.ts`).
- Durable business/audit records are stored in `audit_logs`, email delivery state in `email_notifications`, export records in `export_logs`, and calendar state in `booking_calendar_syncs`.
- Super Admin operational visibility is provided by `app/admin/system-health/page.tsx` and the Microsoft calendar integration page.

## CI/CD & Deployment

**Hosting:**
- Vercel - Full-stack Next.js deployment described in `docs/DEPLOYMENT_NOTES.md`.
- Supabase - Hosted backend platform; migrations are applied separately with the Supabase CLI.

**CI Pipeline:**
- No `.github/workflows/`, GitLab CI, Azure Pipelines, or other committed CI pipeline is detected.
- Local scripts provide lint, typecheck, Vitest, build, QA, and Playwright entry points in `package.json`.

**Deployment configuration status:**
- `vercel.json` is currently an empty object, so no Vercel Cron schedules are declared in source control even though protected cron handlers exist.
- `docs/DEPLOYMENT_NOTES.md` contains integration drift: it describes cron schedules as present and contains an obsolete statement that `/auth/callback` does not exist, while `app/auth/callback/route.ts` is implemented.
- Treat code and current migration files as authoritative, then update deployment documentation/configuration in a dedicated operational-readiness change.

## Environment Configuration

**Core required variables:**
- `NEXT_PUBLIC_APP_URL` - Canonical application URL for callbacks and links (`config/app.ts`, `lib/email/send.ts`).
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Browser/server session client (`lib/supabase/client.ts`, `server.ts`).
- `SUPABASE_SERVICE_ROLE_KEY` - Privileged server client (`lib/supabase/admin.ts`).

**Operational variables:**
- `CRON_SECRET` - Email processing/reminder handlers.
- `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY`, and `SMTP_*` - Email adapters (`lib/email/`).
- `APP_NAME`, `COMPANY_NAME`, `SYSTEM_CONTACT_EMAIL`, and `APP_TIMEZONE` - Server defaults (`config/app.ts`).
- `CALENDAR_SYNC_PROVIDER`, `MICROSOFT_365_CALENDAR_SYNC_ENABLED`, `MICROSOFT_SYNC_MODE`, `MICROSOFT_GRAPH_AUTH_MODE`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_DEFAULT_CALENDAR_ID`, `MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY`, and `MICROSOFT_GRAPH_BASE_URL` - Microsoft Graph (`lib/integrations/microsoft-365-calendar/config.ts`).
- `N8N_CALENDAR_SYNC_ENABLED`, `N8N_CALENDAR_CREATE_WEBHOOK_URL`, `N8N_CALENDAR_UPDATE_WEBHOOK_URL`, `N8N_CALENDAR_DELETE_WEBHOOK_URL`, and `N8N_CALENDAR_WEBHOOK_SECRET` - n8n calendar adapter (`config.ts`).
- `E2E_BASE_URL` and role-specific `E2E_*` credentials - Playwright setup (`playwright.config.ts`, `tests/e2e/helpers/auth.ts`).

**Secrets location:**
- Production secrets belong in Vercel environment settings; local secret-bearing environment files exist and are ignored by Git.
- Non-secret behavioral settings belong in `system_settings`; provider keys, service-role credentials, cron secrets, and token-encryption keys must never be stored there or sent to Client Components.

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` - Supabase/Microsoft OAuth authorization-code callback (`app/auth/callback/route.ts`).
- `GET /api/cron/email/process` - Protected queue processor (`app/api/cron/email/process/route.ts`).
- `GET /api/cron/email/reminders` - Protected reminder queue producer (`app/api/cron/email/reminders/route.ts`).
- `GET /api/facility-availability` - Authenticated availability timeline (`app/api/facility-availability/route.ts`).
- `GET /api/bookings/[id]/invite-candidates` - Authenticated, ownership-aware invitee search (`app/api/bookings/[id]/invite-candidates/route.ts`).
- Five authenticated CSV export GET handlers live under `app/admin/reports/export/`.

**Outgoing:**
- Microsoft identity token endpoint and Microsoft Graph event endpoints (`lib/integrations/microsoft-365-calendar/auth.ts`, `client.ts`).
- n8n create/update/delete webhooks (`lib/integrations/microsoft-365-calendar/n8n-webhook.ts`).
- Resend API or configured SMTP server (`lib/email/provider.ts`, `providers/smtp.ts`).
- Supabase Auth, database, and Storage endpoints through Supabase SDK clients (`lib/supabase/`).

---

*Integration audit: 2026-07-15*
