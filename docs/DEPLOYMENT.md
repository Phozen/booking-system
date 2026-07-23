# Deployment

## Release model

QBook is configured for Vercel. The repository includes CI and a controlled production-release workflow; the actual target environment, provider credentials, and organisation controls remain external responsibilities.

The safe release order is:

1. Review the change and its migration/operational impact.
2. Run the proportionate repository checks.
3. Apply approved Supabase migrations to the exact target project.
4. Confirm target environment variables and Auth/provider configuration.
5. Deploy and promote through the protected release workflow.
6. Run smoke/UAT checks with approved test identities.
7. Record evidence and retain rollback information.

## Before deployment

- Use Node.js 22.x and the committed lockfile.
- Confirm `npm ci`, dependency audit, lint, typecheck, tests, and build pass in the release context.
- Review every new migration and confirm a restore/rollback approach.
- Confirm the intended Supabase project and migration state:

```powershell
npm.cmd exec supabase -- migration list
```

- Set all required server-only values in Vercel; do not commit them.
- Configure Supabase Auth Site URL and redirect URLs for the exact HTTPS application URL.
- Confirm the private `facility-photos` bucket and policies are present.

## Database migrations

Deploy schema changes before relying on them in application code:

```powershell
npm.cmd exec supabase db push
```

Run this only after confirming the linked project is the intended release target. Production migrations are append-only. If an applied migration needs correction, create a new migration; do not edit history.

## Vercel configuration

- Framework: Next.js
- Build command: `npm run build`
- Node version: 22.x
- Do not enable static export.
- Configure `NEXT_PUBLIC_APP_URL` as the canonical production HTTPS URL.
- Keep service-role, cron, email, Microsoft, and n8n values server-only.

`vercel.json` contains a daily UTC schedule for `/api/cron/email/run`. A shorter production cadence requires an approved scheduler/plan capable of it, plus a secure `CRON_SECRET` bearer request.

## External readiness checklist

- [ ] Microsoft tenant restriction and Supabase Auth provider are configured for the intended tenant.
- [ ] The pre-provisioned allowlist contains an active initial Super Admin.
- [ ] Public/password/magic-link access is disabled where required by the access policy.
- [ ] Supabase redirect URLs use the canonical deployment URL.
- [ ] Current migrations exist in the target Supabase project.
- [ ] Storage bucket/policies are verified with real restricted roles.
- [ ] Email provider sender and cron trigger are tested, or email is deliberately disabled.
- [ ] Calendar provider is deliberately disabled or has authorised test evidence.
- [ ] Release ownership, branch/ruleset, and Vercel promotion controls are confirmed.

See [Production checklist](PRODUCTION_CHECKLIST.md) and [Production ownership runbook](PRODUCTION_OWNERSHIP_RUNBOOK.md) for operational evidence requirements.

## Rollback

- Roll back the Vercel deployment to the previous known-good version when application smoke checks fail.
- Stop automated cron delivery by disabling the scheduler/entry before investigating provider incidents.
- For a database issue, stop unsafe writes, assess impact, restore from a verified backup if necessary, and apply a targeted forward migration. Do not use destructive SQL without an approved recovery plan.
- Preserve audit, deployment, and incident evidence.

<!-- VERIFY: Confirm the deployment owner, Vercel project, Supabase project, Auth configuration, cron scheduler, and rollback runbook against the environment before launch. -->
