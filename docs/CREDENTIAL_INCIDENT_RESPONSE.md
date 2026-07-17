# Credential Incident Response

## Status

Rollout is blocked until every exit condition in this document is evidenced.

The first credential-bearing commit currently visible in repository history is
`ae024f75b2c1e35863ac52b6647f8b086a6c7a02`, authored at
`2026-07-16T11:51:06+08:00`. Use that timestamp as the start of the Supabase Auth
log review window. Extend the review window earlier if another clone, ref, fork,
artifact, or log identifies an earlier exposure.

Public clones, caches, and forks made before containment must be treated as
permanently exposed even after repository history is rewritten.

## Required order of operations

1. Confirm Microsoft sign-in succeeds for a company-controlled active Super Admin.
2. Confirm a second company-controlled active Super Admin exists where possible.
3. Temporarily deactivate the compromised approved user if doing so will not remove
   the final recovery administrator.
4. Replace the compromised password with a unique random value that is not stored in
   the repository, chat, ticket, or shared notes.
5. Revoke all Supabase sessions for the compromised user using global sign-out.
6. Wait for the maximum configured access-token lifetime, or keep the approved user
   inactive for that period. Global sign-out destroys refresh tokens, but an issued
   access token remains valid until its expiry.
7. Review Supabase Auth logs from the exposure start through completion of session
   revocation. Record successful and failed sign-ins, refreshes, identity changes,
   password changes, and administrator actions for the affected user.
8. Rotate Supabase project keys or Microsoft Entra credentials only when the review
   finds exposure, personal ownership, unexplained use, or missing provenance. A
   leaked user session does not by itself prove that the Entra client secret leaked.
9. Complete and verify the repository history rewrite below.

Do not remove the affected Auth user as a substitute for session revocation. Do not
declare containment from a password change alone.

## Repository changes in the remediation commit

- Remove the root browser storage, cookie, DOM capture, and local automation files.
- Keep `proxy.ts`; it is the application request proxy.
- Replace the production-targeting QA automation with a non-mutating Preview suite
  that consumes the configured Playwright base URL.
- Ignore browser state, traces, DOM captures, screenshots, reports, and local QA
  outputs.
- Run both working-tree and full-history secret scans in CI and production promotion.

The working-tree scan must pass before the remediation commit is proposed. The
history scan is expected to fail until the rewrite is complete.

## Coordinated Git history rewrite

Perform this only after live session containment and during an announced maintenance
window. Pause merges and pushes first. Use a fresh mirror clone and the current
documented `git-filter-repo` interface; inspect `git filter-repo --help` before
running it.

1. Create a replacement file outside the repository and outside any directory that
   will be committed. Put the exact exposed password on the left and `[REDACTED]` on
   the right using the `git-filter-repo --replace-text` syntax. Include any other
   confirmed credential values found by the investigation.
2. Remove these paths from every ref:
   - `state.json`
   - `cookie.json`
   - `initial-dom.html`
   - `test-login.js`
   - `create-state.js`
   - `generate-state.js`
   - `audit.js`
3. Apply the replacement file to every remaining blob so the exposed password is
   removed from the historical QA suite without removing the current safe suite.
4. Run the history scanner against the rewritten mirror and require zero findings.
5. Force-push all rewritten branches and tags while the maintenance window is active.
6. Delete the external replacement file securely and close the maintenance window.
7. Require every collaborator and automation checkout to reclone. Do not permit old
   clones to push rewritten-away commits.
8. Make an anonymous fresh clone and run both secret scans again.

Do not paste the leaked value into a shell command, CI log, pull-request description,
or this document.

## Exit evidence

| Evidence | Owner | Status / reference |
| --- | --- | --- |
| Microsoft sign-in verified for recovery administrator | Company Auth owner | Pending final recovery verification: Microsoft sign-in was verified for the former recovery administrator before that affected account was disabled for containment. `jerry@qhazanahsabah.com.my`, now the active recovery Super Admin, must complete one normal Microsoft sign-in. |
| Second active Super Admin verified or exception accepted | Product owner | Verified 2026-07-17: `jerry@qhazanahsabah.com.my` is Azure-only and active `super_admin` in both `profiles` and `approved_users`. |
| Compromised password replaced | Supabase Auth owner | Verified 2026-07-17 01:09:47 UTC: the affected user's stored password hash was replaced with a freshly generated value that was not recorded. |
| Global session revocation completed | Supabase Auth owner | Verified 2026-07-17 01:09:47 UTC: all two remaining `auth.sessions` rows for the affected user were deleted; post-action count was zero. |
| Access-token lifetime elapsed or user held inactive | Supabase Auth owner | Contained 2026-07-17: the affected user's `profiles` and `approved_users` status are both `disabled`, while `auth.sessions` remains zero. Middleware, routes, and RLS require an active profile, so any residual token cannot access Qbook. Keep this account disabled until the configured JWT lifetime is independently recorded and the review is closed. |
| Auth log review completed from the exposure start | Security owner | Verified 2026-07-17: the supplied last-24-hours export (635 rows) covers 2026-07-16 02:32:37 UTC–2026-07-17 00:58:51 UTC, including the 03:51:06 UTC exposure start. It shows only the known email recovery, identity-unlink, logout, and Azure sign-in activity; the sole error is the expected pre-configuration manual-linking 404. No Auth event occurred between the final log row and containment. Direct database evidence confirms password rotation, disabled access, and zero sessions at 01:09:47 UTC. |
| Conditional project/Entra credential decision recorded | Security owner | Verified 2026-07-17: the repository incident and Auth-log review show user-password/session exposure only, with no evidence of a Supabase project key or Microsoft Entra client-secret exposure, unexplained Auth administration, or personal credential ownership. No project-key or Entra-secret rotation is indicated; reassess if another clone, artifact, access log, or ownership review finds contrary evidence. |
| Working-tree scan passes | Engineering | Verified 2026-07-17 in a fresh bare clone (`npm run secret-scan`). |
| Full-history scan passes after rewrite | Engineering | Verified 2026-07-17 in the rewritten mirror and fresh clone, including fetched pull-request refs (`npm run secret-scan:history`). |
| All refs force-pushed in maintenance window | Repository owner | Verified 2026-07-17: `main` and seven Dependabot branches force-updated; two unchanged feature branches were retained. |
| Anonymous clone contains no incident artifacts | Independent reviewer | Verified 2026-07-17: fresh bare clone passed both scanners at rewritten `main` commit `66a6bfdb88e918580925fc2b06cd8e1b821d266a`. |
| Collaborators and automation checkouts recloned | Repository owner | Verified 2026-07-17: repository owner confirmed this is the only persistent checkout. This machine uses the clean rewritten checkout; the locked retired directory has no `.git` metadata and cannot push history. Physical removal of that inert local directory can occur after Codex is reopened at `booking-system-rewritten`. |

Phase 1 is complete only when every row has a dated evidence reference.
