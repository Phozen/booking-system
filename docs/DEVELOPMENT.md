# Development Guide

## Principles

- Make the smallest root-cause change; avoid unrelated refactors.
- Preserve the security boundary: validate untrusted input and authorise it on the server/database boundary.
- Keep database history append-only and deploy schema changes through a new migration.
- Keep user/session data and all secrets out of the repository.
- Prefer the nearest relevant test to broad checks while iterating.

## Where changes belong

| Change | Primary location |
| --- | --- |
| Page composition and routing | `app/` |
| Reusable interaction and display | `components/` |
| Server actions, validation, and queries | `lib/` |
| Shared defaults | `config/` |
| Data model, RLS, functions, policies | `supabase/migrations/` |
| Unit/repository behaviour checks | `tests/` |
| Browser role/access journeys | `tests/e2e/` |

## Booking changes

Booking behaviour is sensitive because availability and authority must survive concurrent requests. Preserve these rules:

- use the existing server actions/RPC path rather than creating client-side direct mutations;
- preserve the database overlap constraint and half-open time-range convention;
- keep owner/admin permissions and allowed state transitions explicit;
- update participant and department behaviour atomically with the booking when required;
- treat failed calendar/email work as recorded follow-up, not a reason to corrupt or roll back a valid booking unless the product rule expressly requires it.

Recurring-booking operations are retired. Do not reintroduce recurrence UI, settings, or mutation paths without a separately approved product and migration design.

## Database work

Create a new migration through the Supabase CLI before editing it:

```powershell
npm.cmd exec supabase -- migration new describe_the_change
```

Review the migration for:

- RLS enablement and policies for new tables;
- least-privilege grants for new functions;
- validation/constraints that prevent invalid state independently of the UI;
- safe defaults and backfill consequences;
- compatibility with existing records and deployed environments.

Never modify an applied migration to change a shared or production database. Add a corrective migration instead.

## Authentication and privileged access

- Use normal Supabase clients for request-scoped user work.
- Keep `createAdminClient()` in server-only code; it bypasses RLS.
- Use the project’s existing role/active-user helpers before reading or mutating protected data.
- Never rely solely on a hidden button or route link for authorisation.

## Documentation expectations

Update the closest documentation when a feature, route, configuration key, migration contract, external prerequisite, or operational procedure changes. Keep historical QA reports and completed plans as dated evidence; do not rewrite them to imply a newer test result.

## Useful commands

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run secret-scan
npm.cmd run build
```

See [Testing](TESTING.md) for when to use each command and the limits of their evidence.
