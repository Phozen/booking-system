# Playwright E2E Testing

Qbook production authentication is Microsoft-only. The browser suite never accepts
an email/password credential and never automates an interactive Microsoft sign-in.

## Install browsers

```powershell
npx.cmd playwright install chromium
```

## Public checks

With no credentials, Playwright starts the local app unless `E2E_BASE_URL` is set.
These checks confirm the Microsoft-only login surface, disabled legacy auth routes,
and logged-out redirects:

```powershell
npm.cmd run e2e -- --project=chromium tests/e2e/public-auth.spec.ts tests/e2e/mobile.spec.ts
```

## Authenticated role checks

Prepare three dedicated, active, pre-provisioned company test accounts. A test
operator signs in through Microsoft in a trusted browser and saves a Playwright
storage state for each role. Treat every state file as a bearer credential:

- Store it outside the repository or under `playwright/.auth/` (ignored by Git).
- Never print, upload, or commit it.
- Use short-lived test accounts; revoke the session and delete the file after UAT.

Set only paths to those files, not user passwords:

```txt
E2E_BASE_URL=https://your-verified-qbook-environment.example
E2E_EMPLOYEE_STORAGE_STATE=playwright/.auth/employee.json
E2E_ADMIN_STORAGE_STATE=playwright/.auth/admin.json
E2E_SUPER_ADMIN_STORAGE_STATE=playwright/.auth/super-admin.json
```

The relevant suites skip explicitly when a valid role state is absent. A skip is
not production verification.

## Required production UAT evidence

| Role / boundary | Operator action | Expected evidence |
| --- | --- | --- |
| Unlisted / wrong tenant | Attempt Microsoft sign-in | Rejected before application access; no profile or usable session. |
| Employee | Use employee storage state; open employee routes and an admin route | Employee routes load; admin route redirects; direct approval/role RPC calls are denied. |
| Admin | Use admin storage state; open operational admin routes and Super Admin routes | Operational pages load; user/settings/system-health pages are denied. |
| Super Admin | Use Super Admin storage state; create/deactivate/change a pre-provisioned test record | Only allowlist/RPC path succeeds; final active Super Admin cannot be removed. |
| Booking approval | Attempt direct DML/RPC bypass using employee/Admin tokens | Database rejects malformed, direct, and unauthorized state transitions. |

Capture browser result, account/role used, timestamp, deployment URL/commit, and
relevant audit-log or database response. Restore any changed test allowlist record
through the guarded Super Admin path.

## Commands

```powershell
npm.cmd run e2e
npm.cmd run e2e:ui
npm.cmd run e2e:headed
```

Run against a disposable Supabase project whenever possible. Production testing is
limited to approved, read-heavy smoke checks with dedicated company test accounts.
