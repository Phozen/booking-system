# Production Checklist

Use this checklist before and after the first production deployment.

## Build And QA

- [ ] `npm.cmd run lint` passes.
- [ ] `npm.cmd run typecheck` passes.
- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run qa` passes.
- [ ] `npm.cmd run pages:build` passes in the deployment environment.
- [ ] OpenNext build warning about deprecated `middleware.ts` has been reviewed and accepted until Cloudflare supports Next.js 16 Node.js Proxy output.

## Supabase

- [ ] Production Supabase project is selected.
- [ ] `npx.cmd supabase migration list` shows migrations `0001` through `0009`.
- [ ] `npx.cmd supabase db push` has been run successfully.
- [ ] RLS is enabled on application tables.
- [ ] `bookings_no_overlapping_active` exclusion constraint exists.
- [ ] `facility-photos` storage bucket exists and is private.
- [ ] First admin account is registered and promoted.
- [ ] Default facilities are present.
- [ ] Default equipment is present.
- [ ] Default system settings are present.

## Cloudflare Environment Variables

- [ ] `NEXT_PUBLIC_APP_URL` is set to the production HTTPS domain.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set as a server-only secret.
- [ ] `APP_TIMEZONE=Asia/Kuala_Lumpur`.
- [ ] `APP_NAME` is set.
- [ ] `COMPANY_NAME` is set.
- [ ] `SYSTEM_CONTACT_EMAIL` is set.
- [ ] `EMAIL_PROVIDER=resend`, if real email sending is enabled.
- [ ] `EMAIL_API_KEY` is set as a server-only secret, if real email sending is enabled.
- [ ] `EMAIL_FROM` is set to a verified sender, if real email sending is enabled.

## Supabase Auth

- [ ] Site URL is the production HTTPS app URL.
- [ ] Redirect URLs include `/login`.
- [ ] Redirect URLs include `/register`.
- [ ] Redirect URLs include `/reset-password`.
- [ ] Redirect URLs include `/dashboard`.
- [ ] Redirect URLs include `/admin/dashboard`.
- [ ] Preview deployment URLs are added if auth is tested from previews.

## Email

- [ ] Resend sender domain or sender email is verified.
- [ ] `EMAIL_FROM` matches a verified sender.
- [ ] Booking confirmation notification can be queued.
- [ ] Queued email processing works from `/admin/email-notifications`.
- [ ] Failed email processing records a clear error.

## Domain And HTTPS

- [ ] Domain is added to Cloudflare.
- [ ] Exabytes nameservers point to Cloudflare, if Cloudflare is managing DNS.
- [ ] Custom domain is connected to the Cloudflare deployment.
- [ ] Apex/root domain behavior is configured.
- [ ] `www` behavior is configured.
- [ ] Non-canonical host redirects if required.
- [ ] HTTPS certificate is active.
- [ ] `NEXT_PUBLIC_APP_URL` matches the canonical production URL.
- [ ] Supabase Auth URLs match the canonical production URL.

## Security

- [ ] `docs/SECURITY_CHECKLIST.md` has been reviewed.
- [ ] Employees cannot access `/admin/*`.
- [ ] Employees cannot view other users' bookings.
- [ ] Disabled users cannot access protected pages.
- [ ] Service role key is not exposed in browser code.
- [ ] Email API key is not exposed in browser code.
- [ ] `.env.local` and `.env*` files are not committed.
- [ ] Cloudflare Access or another internal-only control has been considered.

## Production Smoke Tests

- [ ] Visit homepage.
- [ ] Register or create a test employee.
- [ ] Log in as employee.
- [ ] Log in as admin.
- [ ] Facility list loads.
- [ ] Facility detail loads.
- [ ] Booking creation works.
- [ ] Overlap prevention works.
- [ ] Back-to-back booking works.
- [ ] My Bookings loads.
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

- [ ] Previous deployment is available for rollback.
- [ ] Supabase backups are enabled.
- [ ] Deployment owner knows how to roll back the Cloudflare deployment.
- [ ] Migration rollback plan is documented for any future schema changes.

## Deferred Production Enhancements

- [ ] Facility photo upload UI.
- [ ] Admin user management UI.
- [ ] Automatic email queue cron.
- [ ] Reminder scheduling automation.
- [ ] Cloudflare Access internal-only gate.
- [ ] PDF and Excel exports.
- [ ] Recurring bookings.
