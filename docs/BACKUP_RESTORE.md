# Backup and Restore Runbook

This runbook covers production handoff backup and recovery for the Booking
System. It is intentionally manual-first for the current deployment model.

## Backup Scope

- Supabase PostgreSQL database, including migrations, RLS policies, bookings,
  invitations, recurrence series, reminders, audit logs, retired scheduling
  request records, and integration sync records.
- Supabase Storage bucket `facility-photos`.
- Vercel environment variables.
- GitHub repository and release history.
- SMTP, Resend, Supabase, and Microsoft credentials in the company password
  vault, never in Git.

## Supabase Database Backup

Recommended routine:

- Enable Supabase project backups if the plan supports it.
- Export a manual SQL backup before major releases or data migrations.
- Keep migration files in Git aligned with the deployed database.
- Record the latest applied migration number during release handoff.

Restore outline:

1. Create or choose the target Supabase project.
2. Restore the database backup.
3. Apply missing migrations with `npx.cmd supabase db push`.
4. Verify RLS is enabled on protected tables.
5. Recreate storage buckets and policies if needed.
6. Promote the first Super Admin if needed.
7. Run manual QA before redirecting users.

## Facility Photo Storage Backup

The `facility-photos` bucket stores operational facility images.

- Export bucket objects periodically.
- Preserve object paths because database records reference storage paths.
- Reapply bucket setup and policies after restore.
- Verify employee photo display and admin upload/delete after restore.

## Vercel Environment Variable Backup

Keep real production env vars in an approved secrets vault. Do not commit real
values. The safe template is:

- `docs/vercel-env-templates/booking-system-vercel-env.example`

Critical env groups:

- Public app config: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only Supabase: `SUPABASE_SERVICE_ROLE_KEY`
- App identity: `APP_TIMEZONE`, `APP_NAME`, `COMPANY_NAME`,
  `SYSTEM_CONTACT_EMAIL`
- Email: `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY`, `SMTP_*`
- Microsoft Calendar: `MICROSOFT_*`

After restoring env vars in Vercel, redeploy the app.

## GitHub Repository Backup

GitHub is the source of truth for application code, migrations, docs, and
tests. Use protected branches and release tags where practical. Keep a mirror if
company policy requires it.

## Secret Rotation After an Incident

If a secret is leaked or suspected leaked:

1. Rotate the affected secret in the provider dashboard.
2. Update Vercel environment variables.
3. Redeploy.
4. Revoke old Microsoft, SMTP, Resend, or Supabase credentials.
5. Review audit logs for suspicious access.
6. Confirm no secret value was committed to Git history.

Server-only secrets include `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_API_KEY`,
`SMTP_PASSWORD`, `MICROSOFT_CLIENT_SECRET`, and Microsoft Graph access tokens.

## Production Incident Checklist

1. Identify the affected route and user-facing symptom.
2. Check Vercel function logs for request ID and digest.
3. Check Supabase logs for query, RLS, or storage failures.
4. If data integrity is at risk, pause destructive admin actions.
5. Take a manual database backup before recovery changes.
6. Patch and run lint, typecheck, tests, build, and QA.
7. Deploy and retest the exact failed flow.
8. Record follow-up actions in project docs or issue tracker.

## Restore Validation Checklist

- Login, registration/reset-password links, and protected redirects work.
- Employee dashboard, facilities, booking creation, invitations, and calendar
  load.
- Admin bookings, approvals, facilities, equipment, reports, audit
  logs, email notifications, and system health load.
- Super Admin-only users/settings/integrations/system health routes are
  protected.
- Facility photos render and admin photo upload/delete works.
- Email disabled mode is safe, or configured provider sends a queued test email.
- Microsoft Calendar disabled mode is safe, or configured sync creates and
  cancels a test confirmed booking event.
