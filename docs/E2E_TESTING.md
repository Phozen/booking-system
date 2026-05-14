# Playwright E2E Testing

This project includes a Playwright foundation for browser-level regression tests.

The E2E suite is intentionally separate from `npm.cmd run qa` because it depends on a running app, Supabase credentials, migrations, seeded facilities, and dedicated test users.

## Install Browsers

After installing dependencies, install at least Chromium:

```powershell
npx.cmd playwright install chromium
```

To install all Playwright-supported browsers:

```powershell
npx.cmd playwright install
```

## Required App Setup

Before running authenticated E2E tests, confirm:

- Supabase migrations are applied.
- Default facilities exist.
- The app has at least one active employee test user.
- The app has at least one active admin test user.
- The app has at least one active super admin test user.
- Test users use safe non-production credentials.
- Email sending can remain disabled; E2E tests do not send real email.

Prefer a dedicated Supabase test project. If testing against production, use read-heavy smoke tests only and dedicated test accounts.

## Environment Variables

Set these in `.env.local` or the shell before running E2E tests:

```txt
E2E_BASE_URL=http://localhost:3000
E2E_EMPLOYEE_EMAIL=
E2E_EMPLOYEE_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_SUPER_ADMIN_EMAIL=
E2E_SUPER_ADMIN_PASSWORD=
E2E_USE_PRODUCTION=false
```

`E2E_BASE_URL` is optional. If blank, Playwright starts the local dev server at `http://localhost:3000`.

Credential-dependent tests are skipped when their matching email/password variables are missing. Public route and logged-out redirect tests still run.

Do not commit real credentials.

## Commands

Run the suite:

```powershell
npm.cmd run e2e
```

Run with the Playwright UI:

```powershell
npm.cmd run e2e:ui
```

Run headed:

```powershell
npm.cmd run e2e:headed
```

## Current Test Coverage

Current E2E files live in `tests/e2e/`:

- `public-auth.spec.ts`: homepage/auth pages and logged-out redirects.
- `employee.spec.ts`: employee login, employee pages, admin denial, and booking form validation.
- `admin.spec.ts`: admin login, operational admin pages, and super-admin page denial.
- `super-admin.spec.ts`: super admin access to users and settings.
- `access-control.spec.ts`: focused role restriction smoke tests.
- `mobile.spec.ts`: minimal mobile dashboard checks.

## Local Versus Deployed Testing

Local testing:

- Leave `E2E_BASE_URL` blank or set it to `http://localhost:3000`.
- Playwright will reuse an existing local server or start `npm.cmd run dev` on Windows.

Deployed testing:

- Set `E2E_BASE_URL=https://your-vercel-app.vercel.app`.
- Set `E2E_USE_PRODUCTION=true` only when intentionally smoke testing production.
- Use dedicated test accounts.
- Avoid destructive tests against production.

## Known Limitations

- The initial suite avoids creating real bookings to prevent flaky data coupling.
- Facility photo upload, real email sending, and destructive admin actions are not covered.
- Full seed/reset automation is not implemented yet.
- For production, authenticated tests should be treated as smoke tests unless a disposable test dataset exists.
