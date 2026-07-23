# Testing

## Test layers

| Layer | Tool | Purpose |
| --- | --- | --- |
| Static quality | ESLint and TypeScript | Catch lint/type regressions |
| Unit and repository behaviour | Vitest | Validate actions, validation, access boundaries, migrations, queues, and configuration contracts |
| Browser flows | Playwright | Exercise public, employee, admin, Super Admin, and mobile journeys |
| Database integration | Supabase tooling | Validate deployed SQL/RPC/RLS behaviour when an authorised environment is available |
| Production UAT | Human/operator evidence | Validate provider, tenant, storage, release, and role boundaries end to end |

## Commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run qa
npm.cmd run e2e
npm.cmd run secret-scan
```

`npm run qa` runs lint, tests, and build. CI additionally runs a high-severity dependency audit. The production-release workflow repeats release checks before Vercel promotion.

## Targeted checks

During development, run the narrowest check that covers the change. Examples:

```powershell
npm.cmd test -- tests/booking-departments-migration.test.ts
npm.cmd test -- tests/booking-action-security.test.ts
npm.cmd test -- tests/email-cron-route.test.ts
npm.cmd run e2e -- --project=chromium tests/e2e/public-auth.spec.ts
```

When a change affects a deployment, migration, auth boundary, or shared booking flow, expand verification proportionately and record remaining evidence gaps.

## Browser testing safety

Public checks can run without credentials. Authenticated Playwright specs require dedicated role-specific storage states. Treat each state file as a bearer credential:

- keep it outside Git or in an ignored path;
- use short-lived dedicated test accounts;
- revoke/delete it after UAT;
- never paste it into an issue, log, or documentation.

The role suites may skip when storage state is unavailable. A skip is missing evidence, not a passing production check.

## What automated checks cannot prove

Successful local/CI checks do not prove:

- the target Supabase project has current migrations;
- Microsoft tenant and Auth Hook policy are correctly configured;
- production storage policies work with real sessions;
- email senders, cron scheduling, and calendar credentials are configured;
- Vercel promotion controls and environment variables are correct;
- real-role workflows work in the proposed environment.

Use [E2E testing](E2E_TESTING.md), [Deployment](DEPLOYMENT.md), and the production runbooks to collect that evidence.
