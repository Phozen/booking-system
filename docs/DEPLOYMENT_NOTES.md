# Deployment Notes

Phase 16 prepares the Booking System for production deployment on Cloudflare with Supabase and Resend.

## Deployment Target Decision

This project is a full-stack Next.js App Router application. It uses server actions, route handlers, Supabase server clients, dynamic admin pages, and authenticated CSV export routes.

Cloudflare's current Pages guide says full-stack server-side rendered Next.js applications should use the Next.js Workers guide. The Workers guide uses the OpenNext Cloudflare adapter. For that reason, this project is configured with:

- `@opennextjs/cloudflare`
- `wrangler`
- `wrangler.jsonc`
- `open-next.config.ts`

Do not use `@cloudflare/next-on-pages` for this project. It is not the safest choice for the current Next.js 16 app.

Static Cloudflare Pages deployment is not appropriate for this application because static export does not support the server-side behavior required by authentication, bookings, admin actions, and report exports.

## Cloudflare Build Setup

Recommended Cloudflare deployment path:

1. Push the repository to GitHub or GitLab.
2. Connect the repository through Cloudflare Workers Builds or deploy with Wrangler.
3. Use OpenNext to build the Next.js app into Cloudflare Worker output.

Build command:

```txt
npm run pages:build
```

Preview command:

```txt
npm run preview
```

Deploy command:

```txt
npm run deploy
```

Worker entrypoint:

```txt
.open-next/worker.js
```

Static assets directory:

```txt
.open-next/assets
```

Wrangler config:

```txt
wrangler.jsonc
```

The `pages:build` name is kept for project vocabulary, but the output is OpenNext Cloudflare Worker output, not a static-only Pages export.

## Next.js 16 Proxy Compatibility Note

Next.js 16 renamed Middleware to Proxy and prefers `proxy.ts`. However, Cloudflare OpenNext currently does not support Next.js Node.js Proxy output. A direct OpenNext build with `proxy.ts` failed with:

```txt
ERROR Node.js middleware is not currently supported. Consider switching to Edge Middleware.
```

To keep Cloudflare deployment unblocked, this project uses `middleware.ts` for the request gate while preserving the same logic in `lib/supabase/middleware.ts`.

Important security note: the request gate is still only an optimistic redirect/session-refresh layer. Protected pages, admin pages, route handlers, and server actions continue to enforce authorization with server-side guards such as `requireUser()` and `requireAdmin()`.

Expected build warning:

```txt
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

Keep this warning documented until Cloudflare OpenNext supports Next.js 16 Node.js Proxy output. Re-test `proxy.ts` when upgrading Next.js or `@opennextjs/cloudflare`.

## Node.js And Tooling Requirements

Use a current Node.js LTS version supported by Next.js 16 and Cloudflare tooling.

Recommended production build environment:

- Node.js 22 LTS, or the current Cloudflare-supported Node.js LTS
- npm matching the Node.js installation
- Wrangler 3.99.0 or later

Local Windows note: OpenNext documents that Windows support is best-effort. If `npm run pages:build` fails locally on Windows due to filesystem or native package issues, run the deployment build in WSL, GitHub Actions, or Cloudflare's Linux build environment.

## Required Environment Variables

Set these in Cloudflare for Production and Preview environments. Keep local values in `.env.local`.

Public browser-safe values:

```txt
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Server-only secrets:

```txt
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EMAIL_API_KEY=your-resend-api-key
```

Server-side app configuration:

```txt
APP_TIMEZONE=Asia/Kuala_Lumpur
APP_NAME=Booking System
COMPANY_NAME=Your Company Name
SYSTEM_CONTACT_EMAIL=admin@example.com
EMAIL_PROVIDER=resend
EMAIL_FROM=Booking System <bookings@your-domain.com>
```

Security rules:

- Only variables prefixed with `NEXT_PUBLIC_` are safe for browser usage.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- `EMAIL_API_KEY` must remain server-only.
- Do not add service role keys or email API keys to `NEXT_PUBLIC_*` variables.
- Do not store provider API keys in `system_settings`.

## Environment Variable Groups

Production:

- `NEXT_PUBLIC_APP_URL` must be the final HTTPS production domain.
- Supabase URL and keys must point to the production Supabase project.
- `EMAIL_FROM` must be verified in Resend.

Preview:

- `NEXT_PUBLIC_APP_URL` should be the Cloudflare preview URL if testing auth callbacks or email links from preview.
- Use a separate Supabase project where possible.
- If using the production Supabase project, create clearly named preview test users and test records.

Local development:

- Store values in `.env.local`.
- Use `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- Leave `EMAIL_PROVIDER` and `EMAIL_API_KEY` blank unless testing real email sending.

## Supabase Production Setup

1. Confirm migrations are applied:

```powershell
npx.cmd supabase migration list
npx.cmd supabase db push
```

2. Confirm remote migrations `0001` through `0009` are applied.
3. Confirm RLS is enabled on application tables.
4. Confirm the `facility-photos` storage bucket exists and is private.
5. Register the first admin user through the app.
6. Promote the first admin in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

## Supabase Auth URLs

Set the Supabase Auth Site URL to the production app URL:

```txt
https://your-domain.com
```

Add redirect URLs for:

```txt
https://your-domain.com/login
https://your-domain.com/register
https://your-domain.com/reset-password
https://your-domain.com/dashboard
https://your-domain.com/admin/dashboard
```

For previews, add the Cloudflare preview URL if testing sign-up, login, or password reset from preview deployments.

Current project note: there is no `/auth/callback` route in this app. Password reset currently redirects to `/reset-password`.

## Resend Email Setup

1. Verify the sender domain or sender email in Resend.
2. Set Cloudflare environment variables:

```txt
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your-resend-api-key
EMAIL_FROM=Booking System <bookings@your-domain.com>
```

3. Create a booking or approval flow that queues an email notification.
4. Open `/admin/email-notifications`.
5. Click `Process queued emails`.
6. Confirm the notification becomes `sent` and `sent_at` is populated.

If `EMAIL_PROVIDER` or `EMAIL_API_KEY` is missing, processing should fail safely and record a clear error instead of crashing.

## Exabytes And Cloudflare Custom Domain

High-level DNS path:

1. Add the domain to Cloudflare.
2. If Exabytes is currently authoritative DNS, update the domain nameservers at Exabytes to the Cloudflare nameservers.
3. Wait for DNS propagation.
4. Add the custom domain to the Cloudflare Worker or project deployment.
5. Follow Cloudflare's generated DNS instructions for root/apex and `www`.
6. Decide the canonical host:
   - `https://your-domain.com`
   - or `https://www.your-domain.com`
7. Configure redirects for the non-canonical host if needed.
8. Confirm HTTPS certificate status is active.
9. Update `NEXT_PUBLIC_APP_URL` and Supabase Auth URLs to the canonical HTTPS domain.

## HTTPS Checklist

- [ ] Production domain opens over HTTPS.
- [ ] HTTP redirects to HTTPS.
- [ ] `www` and apex behavior is intentional.
- [ ] Supabase Auth Site URL uses HTTPS.
- [ ] Email templates link to the HTTPS production domain.

## Post-Deployment Smoke Test Checklist

- [ ] Visit homepage.
- [ ] Register a user, if registration is enabled.
- [ ] Log in as employee.
- [ ] Log in as admin.
- [ ] Open `/facilities`.
- [ ] Open a facility detail page.
- [ ] Create a valid booking.
- [ ] Confirm overlapping booking is blocked.
- [ ] Confirm back-to-back booking is allowed.
- [ ] Open `/my-bookings`.
- [ ] Open `/admin/bookings`.
- [ ] Test approval flow if approval mode is enabled.
- [ ] Create and test a blocked period.
- [ ] Create and test a maintenance closure.
- [ ] Open `/admin/email-notifications`.
- [ ] Process queued emails with production email config.
- [ ] Open `/admin/reports`.
- [ ] Export a CSV report.
- [ ] Open `/admin/audit-logs`.
- [ ] Open `/admin/settings`.
- [ ] Log out.

## Rollback Notes

- Keep the previous production deployment available in Cloudflare until smoke tests pass.
- If deployment fails before release, roll back to the previous successful Worker version.
- If a migration causes a production data issue, stop writes first, inspect the migration, and apply a targeted fix migration. Do not run destructive SQL without a backup.
- Keep Supabase backups enabled for production.

## Known Limitations

- Facility photo upload UI is still deferred.
- Admin user management UI is still deferred.
- Automatic email cron/background processing is deferred.
- Reminder scheduling automation is deferred.
- PDF and Excel exports are deferred.
- Recurring bookings are deferred.
- Cloudflare Access is recommended as a future internal-only network-layer control.

## Reference Links

- Cloudflare Pages Next.js guide: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- Cloudflare Workers Next.js guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- OpenNext Cloudflare guide: https://opennext.js.org/cloudflare/get-started
