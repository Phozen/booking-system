# Codebase Structure

**Analysis Date:** 2026-07-15

## Directory Layout

```text
booking-system/
|-- app/                         # Next.js App Router routes and boundaries
|   |-- (auth)/                  # Public login/register/reset route group
|   |-- (app)/                   # Authenticated employee route group
|   |-- admin/                   # Admin and Super Admin routes
|   |-- api/                     # JSON and protected cron Route Handlers
|   `-- auth/callback/           # Supabase/Microsoft OAuth callback
|-- components/                  # React presentation and interaction modules
|   |-- admin/                   # Admin feature UI
|   |-- bookings/                # Booking/detail/form/invitation UI
|   |-- calendar/                # Calendar views and controls
|   |-- facilities/              # Facility cards/details/timelines
|   |-- shared/                  # Cross-feature presentation patterns
|   `-- ui/                      # Low-level UI primitives
|-- config/                      # App identity/defaults and navigation model
|-- lib/                         # Domain, application, data-access, and adapters
|   |-- admin/                   # Admin domain modules by feature
|   |-- auth/                    # Session, guards, roles, auth actions
|   |-- bookings/                # Booking domain and subfeatures
|   |-- email/                   # Queue, templates, and provider adapters
|   |-- integrations/            # Microsoft 365/n8n calendar integration
|   |-- settings/                # Typed settings and database resolution
|   `-- supabase/                # Browser/server/admin/proxy clients
|-- supabase/
|   |-- migrations/              # Ordered PostgreSQL schema/policy changes
|   `-- test-sql/                # Manual SQL invariant checks
|-- tests/
|   `-- e2e/                     # Playwright role and responsive journeys
|-- docs/                        # Requirements, QA, operations, and handoff docs
|-- public/                      # Static browser assets
|-- proxy.ts                     # Next.js 16 request Proxy entry point
|-- next.config.ts               # Next.js configuration
|-- package.json                 # Runtime dependencies and scripts
|-- tsconfig.json                # TypeScript and `@/*` alias configuration
|-- vitest.config.ts             # Unit/integration test runner
|-- playwright.config.ts         # Browser test runner
`-- vercel.json                  # Vercel project config; currently no schedules
```

## Directory Purposes

**`app/`:**
- Purpose: URL structure and HTTP/rendering entry points.
- Contains: 47 pages, 4 layouts, 10 Route Handlers, loading/error/not-found boundaries, global CSS, metadata, and redirects.
- Key files: `app/layout.tsx`, `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx`.
- Rule: Keep pages thin. Parse request state, authorize, load data, and compose components; put reusable business logic in `lib/`.

**`app/(auth)/`:**
- Purpose: Shared public auth layout without adding an `(auth)` URL segment.
- Contains: `/login`, `/register`, and `/reset-password`.
- Key files: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`.

**`app/(app)/`:**
- Purpose: Shared authenticated employee experience without adding an `(app)` URL segment.
- Contains: Dashboard, facilities, booking create/detail/edit/print/recurrence, calendar, invitations, profile, notification redirects/preferences.
- Key files: `app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`, `app/(app)/bookings/new/page.tsx`.
- Rule: Use `requireUser()` at sensitive page/query boundaries even though the layout and Proxy also filter access.

**`app/admin/`:**
- Purpose: Admin and Super Admin operational/governance routes.
- Contains: Bookings, approvals, calendar, facilities, equipment, unified unavailability, users, reports/CSV exports, audit logs, email queue, system health/settings, and Microsoft calendar integration.
- Key files: `app/admin/layout.tsx`, `app/admin/dashboard/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/reports/export/*/route.ts`.
- Legacy redirects: `app/admin/blocked-dates/page.tsx` and `app/admin/maintenance/page.tsx` redirect into unified `/admin/unavailability`.

**`app/api/` and `app/auth/callback/`:**
- Purpose: HTTP endpoints that are not form Server Actions.
- Contains: Availability JSON, invite-candidate search, protected email cron endpoints, and OAuth callback.
- Key files: `app/api/facility-availability/route.ts`, `app/api/cron/email/process/route.ts`, `app/auth/callback/route.ts`.
- Rule: Validate path/query/header input and authorize inside every Route Handler; layouts do not wrap handlers.

**`components/`:**
- Purpose: Reusable server/client presentation modules.
- Contains: 122 files grouped by domain; 53 modules are explicit Client Components.
- Key files: `components/app/app-header.tsx`, `components/admin/admin-shell.tsx`, `components/bookings/booking-form.tsx`, `components/calendar/month-calendar-grid.tsx`.
- Rule: Use `"use client"` only at the smallest interaction boundary. Pass narrow, serializable props from Server Components.

**`components/ui/`:**
- Purpose: Low-level design-system primitives and variants.
- Contains: Buttons, cards, form controls, alerts, and labels.
- Key files: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`.
- Rule: Keep primitives domain-agnostic; feature wording and data rules belong in domain components.

**`components/shared/`:**
- Purpose: Cross-feature UI behavior and page patterns.
- Contains: Page headers, breadcrumbs, empty/error/loading states, navigation, confirmation dialogs, toasts, skip links, and route loading.
- Key files: `components/shared/page-header.tsx`, `components/shared/confirm-dialog.tsx`, `components/shared/loading-state.tsx`.

**`lib/`:**
- Purpose: Server Actions, queries, validation, DTO mapping, formatting, business rules, and infrastructure adapters.
- Contains: 104 TypeScript files organized primarily by domain.
- Key files: `lib/auth/guards.ts`, `lib/bookings/actions.ts`, `lib/bookings/availability.ts`, `lib/settings/queries.ts`, `lib/supabase/admin.ts`.
- Rule: Keep imports flowing from feature orchestration to adapters. Add `server-only` wherever a module reads secrets, constructs a privileged client, or must never enter a client bundle.

**`lib/admin/`:**
- Purpose: Admin-specific use cases grouped by operational domain.
- Contains: `actions.ts`, `queries.ts`, `validation.ts`, and report/export helpers for bookings, facilities, equipment, maintenance, blocked periods, users, settings, audit logs, email notifications, and integrations.
- Key files: `lib/admin/bookings/actions.ts`, `lib/admin/reports/queries.ts`, `lib/admin/users/actions.ts`.

**`lib/bookings/`:**
- Purpose: Employee booking domain plus shared calendar/availability logic.
- Contains: Main actions/queries/validation, recurring bookings, invitations, catering, usage state, formatting, and errors.
- Key files: `lib/bookings/actions.ts`, `lib/bookings/queries.ts`, `lib/bookings/validation.ts`, `lib/bookings/recurring/actions.ts`, `lib/bookings/invitations/actions.ts`.

**`lib/supabase/`:**
- Purpose: Central client factories for each trust/runtime context.
- Contains: Browser anon client, cookie-backed server client, service-role admin client, and Proxy session refresh.
- Key files: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/middleware.ts`.

**`lib/email/`:**
- Purpose: Provider-neutral durable email queue and rendering.
- Contains: Queue claiming/processing, reminders, provider selection, SMTP adapter, templates, and types.
- Key files: `lib/email/queue.ts`, `lib/email/reminders.ts`, `lib/email/provider.ts`, `lib/email/templates.ts`.

**`lib/integrations/`:**
- Purpose: External service adapters and integration orchestration.
- Contains: Microsoft Graph/n8n calendar configuration, auth, delegated token storage, HTTP client, event mapper, sync state, and safe errors.
- Key files: `lib/integrations/microsoft-365-calendar/sync.ts`, `config.ts`, `client.ts`, `n8n-webhook.ts`.

**`supabase/migrations/`:**
- Purpose: Versioned, append-only database evolution.
- Contains: 30 numeric SQL migrations for extensions, enums, tables, indexes, triggers/functions, RLS, seed data, Storage policy notes, and subsequent features/hardening.
- Key files: `supabase/migrations/0003_core_tables.sql`, `0006_rls_policies.sql`, `0022_booking_mutation_rpcs.sql`, `0030_retire_unused_scheduling_requests.sql`.
- Rule: Never rewrite an applied migration. Add the next zero-padded migration and include policy/grant/index changes needed by the feature.

**`tests/`:**
- Purpose: Automated application verification outside production source folders.
- Contains: 32 Vitest unit/integration files and 6 Playwright specs plus E2E helpers.
- Key files: `tests/booking-mutation-rpcs.integration.test.ts`, `tests/microsoft-calendar-sync.test.ts`, `tests/e2e/access-control.spec.ts`, `tests/e2e/helpers/auth.ts`.

**`docs/`:**
- Purpose: Product requirements, UX, security, QA, deployment, backup, storage, and integration handoff.
- Contains: 17 Markdown documents plus a safe Vercel environment template.
- Key files: `docs/REQUIREMENTS.md`, `docs/DEPLOYMENT_NOTES.md`, `docs/DATABASE_SCHEMA.md`, `docs/MICROSOFT_365_CALENDAR_SYNC.md`.
- Rule: Update operational docs in the same change when routes, migrations, schedules, or required environment keys change.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Global HTML/body shell and providers.
- `app/page.tsx`: Root login landing page.
- `app/(app)/layout.tsx`: Employee application shell.
- `app/admin/layout.tsx`: Admin application shell.
- `proxy.ts`: Next.js 16 request Proxy.
- `app/auth/callback/route.ts`: OAuth callback.
- `app/api/cron/email/process/route.ts`: Email worker HTTP entry.
- `app/api/cron/email/reminders/route.ts`: Reminder producer HTTP entry.

**Configuration:**
- `package.json`: Node engine, scripts, dependencies.
- `next.config.ts`: Framework configuration.
- `tsconfig.json`: Strict TypeScript and root alias.
- `config/app.ts`: Environment-backed identity/defaults.
- `config/navigation.ts`: Employee/admin navigation and Super Admin visibility.
- `lib/settings/app-settings.ts`: Typed runtime setting keys/defaults.
- `vercel.json`: Deployment-specific configuration.

**Core Logic:**
- `lib/auth/session.ts`, `lib/auth/guards.ts`: Authentication and role gates.
- `lib/bookings/actions.ts`, `lib/bookings/availability.ts`: Booking orchestration and availability.
- `lib/admin/bookings/actions.ts`: Admin booking/approval/usage operations.
- `lib/settings/queries.ts`: Effective settings resolution.
- `lib/email/queue.ts`: Durable email processing.
- `lib/integrations/microsoft-365-calendar/sync.ts`: Calendar lifecycle orchestration.
- `lib/audit/log.ts`: Audit persistence.
- `supabase/migrations/0022_booking_mutation_rpcs.sql`: Transactional booking mutations.

**Testing:**
- `vitest.config.ts`: Unit/integration runner.
- `playwright.config.ts`: E2E runner and browser projects.
- `tests/*.test.ts`: Unit and Supabase integration tests.
- `tests/e2e/*.spec.ts`: Role/access/responsive journeys.
- `supabase/test-sql/*.sql`: Manual database verification.

## Route Organization

**Public/auth:**
- `/`, `/login`, `/register`, `/reset-password`, `/auth/callback` from `app/page.tsx`, `app/(auth)/`, and `app/auth/callback/route.ts`.

**Employee:**
- `/dashboard`, `/facilities`, `/facilities/[slug]`, `/bookings/new`, `/bookings/recurring/new`, `/bookings/[id]`, `/bookings/[id]/edit`, `/bookings/[id]/print`, `/my-bookings`, `/calendar`, `/invitations`, and `/profile` from `app/(app)/`.

**Admin:**
- `/admin/dashboard`, `/admin/calendar`, `/admin/bookings`, `/admin/approvals`, `/admin/facilities`, `/admin/equipment`, `/admin/unavailability`, `/admin/email-notifications`, `/admin/reports`, `/admin/audit-logs`, and `/admin/profile` from `app/admin/`.

**Super Admin:**
- `/admin/users`, `/admin/settings`, `/admin/system-health`, and `/admin/integrations/microsoft-calendar`; each page/action uses `requireSuperAdmin()`.

**HTTP-only:**
- JSON/cron endpoints under `/api/*` and CSV downloads under `/admin/reports/export/*`; these do not participate in layouts.

## Naming Conventions

**Files:**
- Lowercase kebab-case modules: `booking-availability-timeline.tsx`, `app-settings.ts`.
- Next.js special files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`.
- Feature responsibilities: `actions.ts`, `queries.ts`, `validation.ts`, `types.ts`, `format.ts`/`formatting` helpers.
- Tests: `<domain>.test.ts` for Vitest and `<journey>.spec.ts` for Playwright.
- Migrations: four-digit sequence plus snake_case description, e.g. `0030_retire_unused_scheduling_requests.sql`.

**Directories:**
- Route groups use parentheses: `app/(auth)`, `app/(app)`.
- Dynamic segments use brackets: `app/(app)/bookings/[id]`, `app/admin/facilities/[id]`.
- Feature directories use lowercase kebab-case: `email-notifications`, `blocked-periods`, `microsoft-365-calendar`.

**Symbols:**
- Components/types: PascalCase (`BookingForm`, `AppSettings`).
- Functions/variables: camelCase (`requireSuperAdmin`, `getAppSettings`).
- Database identifiers: snake_case (`booking_calendar_syncs`, `starts_at`).
- Query mappers translate database snake_case into app-facing camelCase near `lib/**/queries.ts`.

## Where to Add New Code

**New employee feature:**
- Route: `app/(app)/<feature>/page.tsx`.
- UI: `components/<feature>/`.
- Reads/mutations/validation: `lib/<feature>/queries.ts`, `actions.ts`, and `validation.ts`.
- Tests: `tests/<feature>.test.ts` and, for a critical journey, `tests/e2e/employee.spec.ts` or a focused new spec.
- Access: call `requireUser()` near data/mutations; rely on RLS for user-scoped data and explicit ownership checks for service-role access.

**New admin feature:**
- Route: `app/admin/<feature>/page.tsx`.
- UI: `components/admin/<feature>/`.
- Domain: `lib/admin/<feature>/actions.ts`, `queries.ts`, `validation.ts`.
- Navigation: add the route/role rule in `config/navigation.ts`.
- Access: use `requireAdmin()` or `requireSuperAdmin()` in pages, actions, and Route Handlers as appropriate.

**New booking mutation:**
- Form/action contract: feature component plus `lib/bookings/validation.ts` or the relevant booking subdirectory.
- Orchestration: a small exported action in `lib/bookings/actions.ts` or a use-case-specific booking submodule.
- Atomic/concurrent rules: add a new migration under `supabase/migrations/`; do not rely only on JavaScript preflight checks.
- Side effects: call dedicated audit/notification/calendar services or enqueue durable work; keep vendor mechanics out of the action.

**New Route Handler:**
- JSON/integration endpoint: `app/api/<feature>/route.ts`.
- Admin download: `app/admin/<feature>/.../route.ts` if the URL is intentionally admin-scoped.
- Shared logic: `lib/<feature>/`; the handler should own only HTTP parsing, authorization, status, and response headers/body.

**New external integration:**
- Adapter: `lib/integrations/<provider>/` with config, client, types, normalized errors, and orchestration split by responsibility.
- Admin status/retry UI: `app/admin/integrations/<provider>/` and `components/admin/integrations/<provider>/`.
- Persistence: append a Supabase migration and add RLS/grants.
- Tests: `tests/<provider>-config.test.ts`, client/orchestration tests with mocked fetch, and a manual readiness doc under `docs/`.

**New email type/provider:**
- Type/template: `lib/email/types.ts`, `lib/email/templates.ts`.
- Provider: `lib/email/provider.ts` or `lib/email/providers/<provider>.ts`.
- Queue behavior: `lib/email/queue.ts` and a migration if the durable schema changes.
- Tests: `tests/email-provider.test.ts`, `tests/email-queue-processor.test.ts`, and event-specific tests.

**New database entity:**
- Schema/policy/index: next numeric file in `supabase/migrations/`.
- Data access: feature `lib/**/queries.ts` with explicit select fields and mapped return type.
- Mutation: guarded Server Action and/or narrowly granted RPC.
- Verification: Vitest integration test plus `supabase/test-sql/` when a manual invariant check is useful.

**New shared component:**
- Domain-agnostic primitive: `components/ui/`.
- Cross-feature composition: `components/shared/`.
- Domain component: matching `components/<feature>/` or `components/admin/<feature>/`.

**New utility:**
- Feature-specific pure helper: keep inside its `lib/<feature>/` domain.
- Truly generic helper: `lib/utils.ts`; avoid turning it into a miscellaneous business-logic bucket.

## Special Directories

**`.next/`:**
- Purpose: Next.js build/dev output and generated route types.
- Generated: Yes.
- Committed: No.

**`node_modules/`:**
- Purpose: Installed dependencies and bundled Next.js 16.2.4 documentation required by `AGENTS.md`.
- Generated: Yes.
- Committed: No.

**`.planning/codebase/`:**
- Purpose: GSD codebase maps used by later planning/execution commands.
- Generated: Yes, by codebase mapping workflow.
- Committed: Project workflow decision; preserve these four current scan documents together.

**`test-results/`:**
- Purpose: Playwright traces, screenshots, and videos from failed/retained runs.
- Generated: Yes.
- Committed: No.

**`outputs/`:**
- Purpose: Local generated QA/artifact output.
- Generated: Yes.
- Committed: No unless an explicit handoff requires a selected artifact.

**`supabase/migrations/`:**
- Purpose: Authoritative database evolution.
- Generated: No; append-only authored SQL.
- Committed: Yes.

**`public/`:**
- Purpose: Directly served static assets.
- Generated: No.
- Committed: Yes.

**`docs/vercel-env-templates/`:**
- Purpose: Safe deployment environment-name template.
- Generated: No.
- Committed: Yes; never place real secret values here.

---

*Structure analysis: 2026-07-15*
