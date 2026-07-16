# Email queue operations

## Production schedule

`vercel.json` invokes `GET /api/cron/email/run` every five minutes in UTC
(`*/5 * * * *`). The route queues due reminders using idempotency keys, then
atomically claims and sends up to 100 due emails. Configure a server-only
`CRON_SECRET` in production; Vercel supplies it as a Bearer token. The deployment
plan must support sub-daily cron, and the job runs only on production deployments.

## Monitoring contract

The route returns 200 only after a successful, healthy cycle. It returns 500 for
reminder insert, queue claim, delivery marker, or other infrastructure failures.
It returns 503 when operator recovery is needed:

- queued more than 10 minutes after `scheduled_for`;
- `sending` longer than 15 minutes;
- terminal `failed` rows;
- queued rows at `max_attempts`;
- unreadable queue-health queries.

The same counts appear under **Admin > System health**. Production is not verified
until Vercel shows a recent successful invocation and the response reports
`health.healthy: true` with every count at zero.

## Recovery runbook

Owner: IT/Super Admin. Prerequisites: corrected provider credentials, verified
`EMAIL_FROM`, production URL, and `CRON_SECRET`.

1. Inspect **Admin > Email notifications** and **Admin > System health**.
2. Fix provider/sender configuration before retrying terminal failures.
3. Select **Retry failed** on Email notifications.
4. Trigger one protected cycle:
   `curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/email/run`
5. Require HTTP 200 and zero failed, overdue, stale, and exhausted rows.

Rollback: remove the cron entry and redeploy to stop automatic processing. Queued
rows remain durable. Restore the entry after resolving the incident. Never place
the secret in repository files, screenshots, or logs.
