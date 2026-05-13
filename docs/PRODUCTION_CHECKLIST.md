# Production Checklist

Use this checklist before and after the first Vercel production deployment.

## Build And QA

- [ ] `npm.cmd run lint` passes.
- [ ] `npm.cmd run typecheck` passes.
- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run qa` passes.
- [ ] Final mobile QA from `docs/FINAL_QA_REPORT.md` is completed.
- [ ] Authenticated employee/admin browser QA is completed.
- [ ] Facility photo storage upload/delete QA is completed with real Supabase credentials.

## Repository Cleanliness

- [ ] `.env`, `.env.local`, `.env*.local`, `.next`, `.open-next`, `.vercel`, `node_modules`, `.next-dev.err.log`, and `.next-dev.out.log` are ignored.
- [ ] No real secrets are committed.
- [ ] No generated build output is tracked.
- [ ] No non-Vercel adapter tooling is required for the Vercel deployment.

## Vercel Project Setup

- [ ] Project is connected to the correct repository.
- [ ] Framework preset is Next.js.
- [ ] Build command is `npm run build`.
- [ ] Output directory is blank/default.
- [ ] Node.js version is 22.x.
- [ ] Production branch is correct.
- [ ] Preview deployments are enabled only where intended.

## Vercel Environment Variables

Public browser-exposed variables:

- [ ] `NEXT_PUBLIC_APP_URL` is set to the current Vercel production URL.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set.

Server-only variables:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set as a server-only secret.
- [ ] `EMAIL_API_KEY` is blank until Resend is ready, or set as a server-only secret after Resend setup.

Server-side app defaults:

- [ ] `APP_TIMEZONE=Asia/Kuala_Lumpur`, unless production needs another timezone.
- [ ] `APP_NAME` is set.
- [ ] `COMPANY_NAME` is set or intentionally blank.
- [ ] `SYSTEM_CONTACT_EMAIL` is set or intentionally blank.
- [ ] `EMAIL_PROVIDER` is blank until Resend is ready, or set to `resend`.
- [ ] `EMAIL_FROM` is blank until Resend is ready, or set to a verified sender.
- [ ] Production `system_settings` values intentionally override or match the environment identity fallbacks.

Security reminders:

- [ ] `NEXT_PUBLIC_*` values are safe for browser exposure.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client code.
- [ ] `EMAIL_API_KEY` is never exposed to client code.
- [ ] Real secrets are entered in Vercel dashboard, not committed.

## Supabase

- [ ] Production Supabase project is selected.
- [ ] `npx.cmd supabase migration list` shows migrations `0001` through `0012`.
- [ ] `npx.cmd supabase db push` has been run successfully.
- [ ] RLS is enabled on application tables.
- [ ] `bookings_no_overlapping_active` exclusion constraint exists.
- [ ] `facility-photos` storage bucket exists and is private.
- [ ] Storage policies allow active-user reads and admin writes for facility photos.
- [ ] Default facilities are present.
- [ ] Default equipment is present.
- [ ] Default system settings are present.
- [ ] App identity settings are reviewed for production.
- [ ] Registration settings are reviewed.
- [ ] Allowed email domains are reviewed.
- [ ] Default approval settings are reviewed.

## First Admin

- [ ] First user account is registered.
- [ ] First admin has been promoted through Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

- [ ] Admin can log in and open `/admin/dashboard`.
- [ ] Admin can use `/admin/users` for everyday role/status changes after first promotion.

## Supabase Auth

For current Vercel URL testing:

- [ ] Site URL is the current Vercel production URL.
- [ ] Redirect URLs include `http://localhost:3000/**`.
- [ ] Redirect URLs include `https://your-vercel-app.vercel.app/**`.
- [ ] Preview deployment URLs are added if auth is tested from previews.

After custom domain setup:

- [ ] Site URL is updated to the canonical custom HTTPS URL.
- [ ] Redirect URLs include `https://your-domain.com/**`.
- [ ] Redirect URLs include `https://www.your-domain.com/**`, if using `www`.

## Email

Email can stay disabled for MVP testing.

- [ ] Queued notifications are created by booking flows.
- [ ] Processing queued emails with blank provider config fails safely with a clear error.
- [ ] Resend sender domain or sender email is verified before real sending.
- [ ] `EMAIL_FROM` matches a verified sender before real sending.
- [ ] Queued email processing works from `/admin/email-notifications` after Resend is configured.
- [ ] Sent notifications populate provider name, provider message ID when available, and `sent_at`.

## Domain And HTTPS

No custom domain is required for current MVP testing.

When the Exabytes/custom domain is ready:

- [ ] Domain is added to Vercel.
- [ ] DNS records are configured as Vercel instructs.
- [ ] If Cloudflare manages DNS, Exabytes nameservers point to Cloudflare.
- [ ] Apex/root domain behavior is configured.
- [ ] `www` behavior is configured.
- [ ] Non-canonical host redirects if required.
- [ ] HTTPS certificate is active.
- [ ] `NEXT_PUBLIC_APP_URL` matches the canonical production URL.
- [ ] Supabase Auth URLs match the canonical production URL.
- [ ] Resend domain verification is completed before enabling real emails.

## Security

- [ ] `docs/SECURITY_CHECKLIST.md` has been reviewed.
- [ ] Employees cannot access `/admin/*`.
- [ ] Employees cannot view other users' bookings.
- [ ] Employees cannot upload/manage facility photos.
- [ ] Employees cannot manage users.
- [ ] Disabled users cannot access protected pages.
- [ ] Service role key is not exposed in browser code.
- [ ] Email API key is not exposed in browser code.
- [ ] `.env.local` and `.env*` files are not committed.
- [ ] Vercel protection, Cloudflare Access, or another internal-only control has been considered.

## Production Smoke Tests

- [ ] Visit homepage.
- [ ] Register or create a test employee.
- [ ] Log in as employee.
- [ ] Log in as admin.
- [ ] Facility list loads.
- [ ] Facility detail loads.
- [ ] Facility photo appears or placeholder appears cleanly.
- [ ] Booking creation works.
- [ ] Overlap prevention works.
- [ ] Back-to-back booking works.
- [ ] My Bookings loads.
- [ ] Profile page loads and updates safe fields.
- [ ] Employee calendar loads.
- [ ] Admin users loads.
- [ ] Admin bookings loads.
- [ ] Approval flow works.
- [ ] Blocked period prevents booking.
- [ ] Maintenance closure prevents booking.
- [ ] Email queue page loads.
- [ ] Reports page loads.
- [ ] CSV export downloads.
- [ ] Export log is created.
- [ ] Audit log is created.
- [ ] Settings page loads and updates a non-sensitive setting.
- [ ] Logout works.

## Rollback Readiness

- [ ] Previous Vercel deployment is available for rollback.
- [ ] Supabase backups are enabled.
- [ ] Deployment owner knows how to roll back a Vercel deployment.
- [ ] Migration rollback plan is documented for any future schema changes.

## Deferred Production Enhancements

- [ ] Automatic email queue cron.
- [ ] Reminder scheduling automation.
- [ ] PDF and Excel exports.
- [ ] Recurring bookings.
- [ ] Dark mode.
- [ ] Collaboration/invitations.
- [ ] Internal-only network access gate.
