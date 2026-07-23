# HTTP API Reference

QBook is primarily a server-rendered App Router application. Most mutations are server actions backed by Supabase/RPCs rather than a public REST API. The routes below are the HTTP endpoints implemented in this repository.

## Public/session endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/auth/callback` | Completes the Supabase/Microsoft authentication callback |
| `GET` | `/api/facility-availability` | Returns facility availability data for supported UI use |
| `GET` | `/api/invite-candidates` | Searches eligible invite candidates |
| `GET` | `/api/bookings/[id]/invite-candidates` | Searches invite candidates in the context of a booking |

These endpoints rely on the application’s session and server-side validation. They are not a stable public integration contract; do not expose them to third-party consumers without an explicit API design, authentication model, rate limits, and versioning policy.

## Protected email operations

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/cron/email/run` | Queues due reminders, processes email, returns queue health |
| `GET` | `/api/cron/email/process` | Processes queued email items |
| `GET` | `/api/cron/email/reminders` | Queues due reminder items |

All cron routes require this header:

```http
Authorization: Bearer <CRON_SECRET>
```

`/api/cron/email/run` returns:

- `200` when the cycle completes and queue health is acceptable;
- `401` for an invalid/missing bearer secret;
- `500` when cron configuration or processing fails;
- `503` when processing completes but queue health needs operator recovery.

Never call these routes from browser code or publish the bearer secret.

## Internal mutation contract

The booking UI uses server actions and PostgreSQL functions including `create_booking_with_participants`, `admin_create_booking_with_participants`, and `set_booking_departments`. These functions validate active users, authority, duplicate participant input, active departments, and booking constraints in the database.

They are intentionally not presented as external HTTP endpoints. Any future external API should be designed separately with documented versioning, OAuth/service authentication, scoped permissions, schema validation, idempotency, audit logging, and rate limits.
