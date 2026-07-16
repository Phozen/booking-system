<!-- refreshed: 2026-07-15 -->
# Architecture

**Analysis Date:** 2026-07-15

## System Overview

```text
Browser
  |  React navigation, forms, fetches
  v
Next.js 16 App Router on Vercel
  +-- Public/auth pages ................. `app/(auth)/`, `app/page.tsx`
  +-- Employee Server Components ........ `app/(app)/`
  +-- Admin/Super Admin components ....... `app/admin/`
  +-- Server Actions / Route Handlers .... `lib/**/actions.ts`, `app/**/route.ts`
  +-- Auth/session Proxy ................. `proxy.ts`, `lib/supabase/middleware.ts`
  |
  v
Feature/application layer
  +-- Guards and validation .............. `lib/auth/`, `lib/**/validation.ts`
  +-- Queries and mutation orchestration . `lib/**/queries.ts`, `lib/**/actions.ts`
  +-- Cross-cutting services ............. `lib/settings/`, `lib/audit/`, `lib/email/`
  +-- External adapters .................. `lib/integrations/`, `lib/supabase/`
  |
  +----------------------+-----------------------+
  v                      v                       v
Supabase              Email providers       Calendar providers
Auth/Postgres/RLS     Resend or SMTP         Microsoft Graph or n8n
Storage/RPCs
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root application shell | Metadata, fonts, theme, view transitions, global route progress, and toast provider | `app/layout.tsx` |
| Employee shell | Secure employee session, settings, notifications, profile completion, and header | `app/(app)/layout.tsx` |
| Admin shell | Admin role gate, settings, profile completion, sidebar, and content frame | `app/admin/layout.tsx` |
| Request proxy | Refresh Supabase cookies and make optimistic login/role redirects | `proxy.ts`, `lib/supabase/middleware.ts` |
| Auth DAL/guards | Resolve Supabase user plus profile; enforce active user/admin/super-admin access | `lib/auth/session.ts`, `lib/auth/guards.ts`, `lib/auth/profile.ts` |
| Feature pages | Fetch server data, parse URL state, and compose feature components | `app/(app)/**/page.tsx`, `app/admin/**/page.tsx` |
| Feature components | Render interactive forms, calendars, tables, dialogs, and responsive UI | `components/` |
| Server actions | Validate input, authorize caller/resource, perform mutation, audit/notify/sync, and revalidate | `lib/**/actions.ts` |
| Query modules | Convert Supabase row shapes into application DTO-like objects | `lib/**/queries.ts` |
| Booking integrity | Enforce conflict, capacity, facility state, and ownership invariants transactionally | `supabase/migrations/0005_functions_triggers.sql`, `0022_booking_mutation_rpcs.sql`, `0023_harden_employee_cancellation_updates.sql` |
| Settings service | Merge environment defaults with database-backed runtime settings | `lib/settings/app-settings.ts`, `lib/settings/queries.ts` |
| Email service | Queue, claim, render, deliver, retry, and record notifications | `lib/email/` |
| Calendar integration | Map booking events and synchronize Microsoft Graph or n8n lifecycle state | `lib/integrations/microsoft-365-calendar/` |
| Audit service | Persist actor, entity, diff, and operational metadata | `lib/audit/log.ts` |

## Pattern Overview

**Overall:** Server-first modular monolith with a Backend-for-Frontend layer and database-enforced business invariants.

**Key Characteristics:**
- Next.js route groups separate public/auth, employee, and admin experiences without adding URL segments (`app/(auth)/`, `app/(app)/`, `app/admin/`).
- Pages are Server Components by default; interactivity is pushed into explicit Client Components in `components/`.
- Forms call feature-scoped Server Actions rather than a broad REST API (`lib/**/actions.ts`).
- Read/write code is organized by domain (bookings, facilities, admin operations, email, settings), not by generic controller/service/repository folders.
- Supabase RLS protects user-scoped reads/writes; service-role access handles privileged aggregation and cross-user operations after application-level guards.
- High-risk booking mutations use PostgreSQL functions/triggers so overlap and authorization rules are not dependent on a single web request implementation.
- Route Handlers are reserved for OAuth callbacks, cron execution, JSON lookup endpoints, and CSV downloads (`app/**/route.ts`).

## Layers

**Routing and Rendering:**
- Purpose: Expose URLs, apply layouts/loading/error boundaries, fetch request-time data, and compose UI.
- Location: `app/`.
- Contains: Server Component pages/layouts, redirects, Route Handlers, error/loading/not-found files.
- Depends on: `lib/`, `components/`, `config/`.
- Used by: Browser navigation, form submissions, OAuth callbacks, schedulers, and download requests.

**Presentation:**
- Purpose: Render reusable UI and own browser-only interaction state.
- Location: `components/`.
- Contains: Domain components (`bookings`, `calendar`, `facilities`, `admin`), shells, shared patterns, and UI primitives.
- Depends on: Server Action references, serializable props, `config/`, pure formatters/validators, React hooks.
- Used by: `app/**/page.tsx` and layouts.

**Application and Domain:**
- Purpose: Authorize use cases, validate input, query/map records, orchestrate side effects, and apply business rules.
- Location: `lib/`.
- Contains: `actions.ts`, `queries.ts`, `validation.ts`, formatters, calendar/date logic, settings, notifications, and audit helpers.
- Depends on: Supabase clients, Next.js server APIs, Zod, database RPCs, integration adapters.
- Used by: Server Components, Client Components through Server Actions, and Route Handlers.

**Infrastructure Adapters:**
- Purpose: Isolate Supabase, email, Microsoft Graph, and n8n mechanics.
- Location: `lib/supabase/`, `lib/email/`, `lib/integrations/`.
- Contains: Client factories, provider selection, token management, HTTP wrappers, event mapping, queue processing.
- Depends on: Environment variables, external SDKs/APIs, Node runtime.
- Used by: Application/domain modules and Route Handlers.

**Persistence and Policy:**
- Purpose: Define the data model and enforce durable integrity/authorization.
- Location: `supabase/migrations/` and `supabase/test-sql/`.
- Contains: Tables, enums, indexes, exclusion constraints, RLS policies, triggers, RPCs, and SQL verification scripts.
- Depends on: Supabase PostgreSQL and `auth.users`.
- Used by: All Supabase clients and operational setup.

## Data Flow

### Authenticated Page Request

1. `proxy.ts` delegates to `updateSession()` in `lib/supabase/middleware.ts`, refreshes Supabase cookies, and may perform an optimistic login/role redirect.
2. The applicable layout calls `requireUser()` or `requireAdmin()` (`app/(app)/layout.tsx`, `app/admin/layout.tsx`).
3. The page repeats the guard close to sensitive data in most feature routes, creates a user-scoped or privileged Supabase client, and calls domain queries (`app/(app)/dashboard/page.tsx`, `app/admin/users/page.tsx`).
4. Query functions select explicit columns and map snake_case database records into application-facing camelCase objects (`lib/bookings/queries.ts`, `lib/facilities/queries.ts`).
5. The Server Component passes serializable data into Client Components only where interaction is needed.

### Booking Mutation

1. A Client Component form invokes a Server Action, for example `createBookingAction` from `components/bookings/booking-form.tsx` to `lib/bookings/actions.ts`.
2. The action calls `requireUser()`, validates untrusted `FormData` with Zod and time-window rules, then checks facility availability.
3. Creation/update delegates atomic integrity to PostgreSQL RPCs such as `create_booking` or `update_own_booking`; database functions validate ownership, facility state, capacity, blocks, maintenance, and overlap (`supabase/migrations/0022_booking_mutation_rpcs.sql`).
4. The action records audit data, queues in-app/email notifications, and attempts one-way calendar sync where status permits.
5. Next.js paths are revalidated and the action returns a serializable state or redirects to the booking detail page.

### Email Queue

1. Booking/admin actions insert durable `email_notifications` rows through helper modules (`lib/notifications/`, `lib/email/`).
2. An administrator action or protected cron Route Handler invokes `processQueuedEmailNotifications()` (`lib/email/queue.ts`).
3. A PostgreSQL RPC atomically claims due/stale items and increments attempts (`supabase/migrations/0024_email_queue_claiming.sql`).
4. The provider adapter sends through Resend or SMTP; success/failure RPCs persist provider IDs, retry timestamps, and sanitized errors.

### Calendar Synchronization

1. Confirm/update/cancel booking flows call the safe sync wrapper in `lib/integrations/microsoft-365-calendar/sync.ts`.
2. Configuration selects disabled, Microsoft Graph, or n8n and resolves central, owner, or facility target behavior (`config.ts`).
3. Microsoft Graph uses app-only token caching or per-user encrypted delegated tokens; n8n receives signed JSON webhook payloads.
4. `booking_calendar_syncs` records provider, target/event IDs, attempts, result, and error; audit logs record the operational action.

**State Management:**
- Durable state: Supabase PostgreSQL and Storage.
- Authentication state: Supabase cookies refreshed by Proxy and accessed by server clients.
- URL/view state: awaited `searchParams` and `params` in App Router pages/handlers, matching Next.js 16 asynchronous request APIs.
- Form state: React `useActionState`/client component state around Server Actions.
- Global browser state: limited to route-loading Zustand state in `lib/store/use-loading-store.ts`, plus theme/toast providers.
- Process state: only the Microsoft app-only token cache in `lib/integrations/microsoft-365-calendar/auth.ts`; correctness does not rely on cache persistence.

## Key Abstractions

**Supabase clients:**
- Purpose: Make trust boundaries explicit.
- Examples: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`.
- Pattern: Browser/user-session/service-role client factories. Use the least-privileged client that can satisfy the use case.

**Role guards:**
- Purpose: Centralize session/profile checks and redirect behavior.
- Examples: `lib/auth/guards.ts`, `lib/auth/profile.ts`.
- Pattern: Reusable async guard called at the data/action boundary; Proxy is only an early filter.

**Feature action/query/validation modules:**
- Purpose: Keep a domain's reads, mutations, and input contracts together.
- Examples: `lib/bookings/actions.ts`, `lib/bookings/queries.ts`, `lib/bookings/validation.ts`; corresponding `lib/admin/*/` modules.
- Pattern: Server Action orchestrator + injected Supabase query helpers + Zod schemas.

**Database RPCs:**
- Purpose: Keep concurrency-sensitive booking mutations atomic.
- Examples: `create_booking`, `update_own_booking`, `admin_create_booking`, `create_recurring_booking_series` in `supabase/migrations/0022_booking_mutation_rpcs.sql`.
- Pattern: Security-definer PostgreSQL functions with explicit grants, validation, and transaction scope.

**Application settings:**
- Purpose: Provide typed runtime behavior with safe defaults.
- Examples: `lib/settings/app-settings.ts`, `lib/settings/queries.ts`.
- Pattern: Environment fallback -> database row map -> typed `AppSettings` DTO.

**Provider adapters:**
- Purpose: Keep email/calendar vendors replaceable and safely disabled.
- Examples: `lib/email/provider.ts`, `lib/integrations/microsoft-365-calendar/client.ts`, `n8n-webhook.ts`.
- Pattern: Validate configuration, return normalized results, sanitize external errors, persist durable status separately.

## Entry Points

**Web application:**
- Location: `app/layout.tsx`, `app/page.tsx`.
- Triggers: Browser request/navigation.
- Responsibilities: Global shell and login landing page.

**Employee application:**
- Location: `app/(app)/layout.tsx` and descendant pages.
- Triggers: Authenticated employee/admin browser navigation.
- Responsibilities: Facilities, bookings, invitations, profile, notifications, and calendar.

**Admin application:**
- Location: `app/admin/layout.tsx` and descendant pages.
- Triggers: Admin/Super Admin navigation.
- Responsibilities: Operations, governance, reporting, configuration, and integration status.

**Server Actions:**
- Location: 17 `"use server"` modules under `lib/`.
- Triggers: HTML/React forms and client event handlers.
- Responsibilities: Publicly reachable POST mutation endpoints; each exported action must validate and authorize independently.

**Route Handlers:**
- Location: 10 `route.ts` files under `app/`.
- Triggers: OAuth, scheduler, client fetch, and report export HTTP requests.
- Responsibilities: HTTP-specific status, headers, JSON/CSV response, and endpoint authorization.

**Proxy:**
- Location: `proxy.ts`.
- Triggers: Matcher-covered HTTP requests before route resolution.
- Responsibilities: Session cookie refresh and optimistic redirects; never use as the sole authorization layer.

**Database migration stream:**
- Location: `supabase/migrations/0001_*.sql` through `0030_*.sql`.
- Triggers: Supabase CLI migration application.
- Responsibilities: Ordered schema/policy evolution.

## Architectural Constraints

- **Next.js version:** Follow local 16.2.4 documentation in `node_modules/next/dist/docs/`; request APIs such as `cookies`, `params`, and `searchParams` are asynchronous in the implementation.
- **Rendering:** Authenticated routes are request-time rendered (`dynamic = "force-dynamic"` is common). Do not introduce static export assumptions.
- **Authorization:** Server Actions and Route Handlers are public entry points. Guard every export and verify resource ownership even if its page/layout is protected.
- **Service role:** `createAdminClient()` bypasses RLS. Call it only from server-only modules after role/resource authorization, and select/return only required fields.
- **Concurrency:** Overlap prevention and multi-row booking mutations belong in PostgreSQL functions/constraints, not only in preflight JavaScript checks.
- **Runtime:** Nodemailer and delegated token encryption require Node-compatible server execution.
- **Background work:** There is no resident worker. Email/reminder processing depends on external HTTP scheduling; calendar sync currently runs in the mutation request path.
- **Global state:** The only material module-level mutable state is the Graph access-token cache in `lib/integrations/microsoft-365-calendar/auth.ts`; Vercel instances do not share it.
- **Schema typing:** Supabase result records are manually typed/cast; no generated `Database` type contract is present.
- **Circular imports:** No intentional circular dependency pattern is detected; keep dependencies flowing from routes/components -> domain/application -> adapters/persistence.

## Anti-Patterns

### Duplicate request-scoped auth and settings reads

**What happens:** Employee/admin layouts and many descendant pages each call `requireUser`/`requireAdmin`; `getCurrentAuthState()` and `getAppSettings()` are not request-memoized (`app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`, `app/admin/layout.tsx`, `lib/auth/session.ts`, `lib/settings/queries.ts`).

**Why it's wrong:** A single navigation can repeat `auth.getUser`, profile, and settings queries. This adds Supabase latency and makes layout-level protection appear sufficient even though Next.js partial rendering requires secure checks near data/action boundaries.

**Do this instead:** Keep page/action checks close to sensitive data, but memoize shared request verification/settings with React `cache` in server-only DAL functions. Preserve independent authorization inside every Server Action and Route Handler.

### Porous privileged data boundary

**What happens:** `createAdminClient()` is correctly `server-only`, but privileged client creation and service-role reads are spread across pages, actions, availability, notifications, audit, reports, and calendar modules. Several generic query modules accept arbitrary `SupabaseClient` instances without `server-only` markers (`lib/bookings/queries.ts`, `lib/facilities/queries.ts`, `lib/admin/reports/queries.ts`).

**Why it's wrong:** Reviewers must trace caller-supplied privilege across many files, and an accidental Client Component import of a server-oriented query module is easier to introduce.

**Do this instead:** Keep service-role client construction inside narrowly named, `server-only` DAL/service modules. Expose DTO-returning functions that perform authorization or require already verified actor context; do not pass privileged clients through presentation code.

### Large synchronous mutation orchestrators

**What happens:** Booking/admin action modules combine validation, data mutation, audit records, notifications, calendar calls, path revalidation, and response shaping; `lib/bookings/actions.ts`, `lib/admin/bookings/actions.ts`, and `lib/integrations/microsoft-365-calendar/sync.ts` exceed 1,000 lines.

**Why it's wrong:** Long request paths couple booking success to many operational concerns, increase timeout/partial-failure states, and make ownership/retry behavior hard to review.

**Do this instead:** Keep transaction-critical mutation in RPC/DAL functions, emit durable outbox/work items in the same database transaction where practical, and process email/calendar/audit follow-up with idempotent handlers. Split action modules by use case while retaining feature locality.

### Uncached high-frequency configuration reads

**What happens:** `getAppSettings()` performs a service-role `system_settings` query on each call and silently falls back to defaults on error (`lib/settings/queries.ts`).

**Why it's wrong:** Settings are read by layouts, pages, booking validation, reminders, and integrations; repeated reads increase latency, while silent fallback can change production behavior during a backend incident.

**Do this instead:** Add request memoization immediately, then define a deliberate cache/revalidation policy and observable degraded-state behavior for operationally critical settings.

## Error Handling

**Strategy:** Return user-safe action states for expected validation/business failures, redirect for auth/navigation control flow, throw for unrecoverable data loads, and log sanitized context server-side.

**Patterns:**
- Zod `safeParse` produces field/form errors before mutation (`lib/**/validation.ts`, `lib/**/actions.ts`).
- Actions return `{status, message}` unions for form state and use `redirect()` after successful create/login flows.
- Provider errors are normalized and sanitized before logs/UI/database persistence (`lib/integrations/microsoft-365-calendar/errors.ts`, `lib/email/queue.ts`).
- Email/calendar operations persist retryable failure state instead of only logging.
- Settings and selected profile/facility reads have defensive fallback behavior; critical booking/admin mutations generally fail closed.
- Global UI error and not-found boundaries live in `app/error.tsx` and `app/not-found.tsx`.

## Cross-Cutting Concerns

**Logging:** `console.error` with scoped identifiers; durable `audit_logs`, `email_notifications`, `export_logs`, and `booking_calendar_syncs` provide operational history.

**Validation:** Zod and explicit URL/date/UUID parsing in TypeScript, reinforced by PostgreSQL constraints, triggers, RLS, and RPC validation.

**Authentication:** Supabase cookies + `auth.getUser`; Proxy refresh/redirect; page/action/handler guards; RLS at the database.

**Authorization:** Three roles plus resource ownership; Super Admin is separated for users/settings/integrations; service-role calls require explicit application checks.

**Privacy:** Select lists and DTO-like mappers limit returned columns; calendar views redact other users' booking titles depending on settings (`app/(app)/calendar/page.tsx`).

**Time:** UTC timestamps in PostgreSQL plus a typed configurable display/business timezone in `lib/settings/app-settings.ts` and date-range helpers.

**Auditability:** Mutations and exports record actor and before/after metadata through `lib/audit/log.ts`.

---

*Architecture analysis: 2026-07-15*
