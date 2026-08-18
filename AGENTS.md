<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

QBook is a Next.js 16 + Supabase facility-booking app. Standard scripts live in `package.json` (`dev`, `lint`, `typecheck`, `test`, `build`); test/setup docs live in `docs/`. The update script already ran `npm ci`, so dependencies are present on boot. The notes below cover only the non-obvious bits for running it in this VM.

### Backend: local Supabase stack (Docker)
- The app fails fast if `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, so a Supabase backend must be running before `npm run dev` is useful. There is no hosted dev project wired up here; use the local stack.
- Docker is required and is NOT started automatically. Start it once per boot: `sudo dockerd &` then `sudo chmod 666 /var/run/docker.sock` (lets the `ubuntu` user talk to Docker without sudo, which matters because `sudo` drops the node/npx PATH). This VM's kernel needs the `fuse-overlayfs` storage driver (already set in `/etc/docker/daemon.json`) and `iptables-legacy`.
- Start the backend from the repo root: `npx supabase start`. It applies every migration in `supabase/migrations/` (which includes seed facilities/equipment from `0007_seed_data.sql`) and prints the local API URL and keys. `supabase/config.toml` is committed so this is reproducible.
- Create `.env.local` (gitignored) from the `supabase start` output. Minimum: `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `MICROSOFT_TENANT_ID` (see below). Local Supabase keys are shared demo defaults, safe only for local dev.
- Query/seed the DB directly via the container: `docker exec -e PGPASSWORD=postgres supabase_db_workspace psql -U postgres -d postgres -c "..."`.

### Auth model (important for testing logged-in flows)
- Access is Microsoft-only OAuth through Supabase Auth; in-app password/registration is intentionally disabled, so you cannot log in through the UI without a real Microsoft tenant + Azure provider.
- To exercise authenticated flows locally, provision a Microsoft-style user directly in the DB, then bypass the OAuth UI. App guards require ALL of: an `auth.users` row whose `raw_app_meta_data.provider = 'azure'`, a matching `auth.identities` row (provider `azure`) whose `identity_data.tid` equals `public.microsoft_access_config.tenant_id`, an active `public.approved_users` allowlist row for the email, and a `public.profiles` row (created by the `on_auth_user_created` trigger). `MICROSOFT_TENANT_ID` in `.env.local` must equal that `tenant_id`.
- `has_active_approved_access(uuid)` only returns true when `p_user_id = auth.uid()`, so it reads false from a raw psql session even when correctly provisioned — verify it under a set `request.jwt.claims` context instead.
- Password sign-in against local GoTrue still works for such a seeded user (set `encrypted_password` via pgcrypto `crypt(pw, gen_salt('bf'))`), which is the simplest way to mint a real session/cookies for testing.

### Known pre-existing failures (not environment issues)
- `npm run lint` reports 2 errors in `components/shared/mobile-nav.tsx` (`react-hooks/set-state-in-effect`).
- `npm test` has 1 failing test, `tests/booking-detail-actions.test.ts` (a source-string assertion that is out of date). 290 other tests pass.
- `npm run typecheck` and `npm run build` pass clean.
