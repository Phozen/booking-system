# Technology Stack

**Analysis Date:** 2026-07-15

## Languages

**Primary:**
- TypeScript 5.9.3 - Application routes, React components, server actions, data access, integrations, and tests in `app/`, `components/`, `lib/`, `config/`, and `tests/`.
- TSX / React 19.2.4 - Server and Client Components in `app/` and `components/`.

**Secondary:**
- PostgreSQL SQL - Schema, RLS policies, triggers, indexes, and transaction-oriented booking RPCs in `supabase/migrations/`.
- CSS - Tailwind CSS 4 theme tokens and global styles in `app/globals.css`.
- ECMAScript modules - Tool configuration in `eslint.config.mjs` and `postcss.config.mjs`.

## Runtime

**Environment:**
- Node.js 22.x - Required by `package.json`; the inspected workspace runs Node 22.18.0.
- Browser runtime - Client Components are explicitly marked with `"use client"`; most rendering and all privileged data access stay server-side.
- Vercel-managed Next.js runtime - Server Components, Server Actions, Route Handlers, and Proxy are deployment entry points.

**Package Manager:**
- npm 10.x - The inspected workspace runs npm 10.9.3.
- Lockfile: `package-lock.json` is present and should remain authoritative for reproducible installs.

## Frameworks

**Core:**
- Next.js 16.2.4 App Router - Routing, React Server Components, Server Actions, Route Handlers, Proxy, fonts, metadata, redirects, and dynamic rendering (`app/`, `proxy.ts`).
- React / React DOM 19.2.4 - UI rendering and form action state.
- Supabase JavaScript 2.105.1 with Supabase SSR 0.10.2 - Auth, Postgres access, RLS-aware browser/server clients, service-role access, and Storage.
- Tailwind CSS 4.2.4 - Styling through `@tailwindcss/postcss` and `app/globals.css`.

**Testing:**
- Vitest 4.1.5 - Node-environment unit and integration tests configured in `vitest.config.ts`.
- Playwright 1.60.0 - Chromium desktop and mobile end-to-end tests configured in `playwright.config.ts`.
- SQL verification scripts - Database invariants and seed checks in `supabase/test-sql/`.

**Build/Dev:**
- Next.js CLI 16.2.4 - `next dev`, `next build`, and `next start` scripts in `package.json`.
- TypeScript 5.9.3 - Strict, no-emit checking through `tsconfig.json` and `npm run typecheck`.
- ESLint 9.39.4 with `eslint-config-next` 16.2.4 - Core Web Vitals and TypeScript rules in `eslint.config.mjs`.
- Supabase CLI 2.95.6 - Migration application and local database workflows.

## Key Dependencies

**Critical:**
- `@supabase/ssr` 0.10.2 and `@supabase/supabase-js` 2.105.1 - Cookie-backed sessions and all data/storage access (`lib/supabase/`).
- `zod` 4.4.1 - Server-side validation for auth, booking, facility, admin, and integration inputs (`lib/**/validation.ts`).
- `react-hook-form` 7.74.0 and `@hookform/resolvers` 5.2.2 - Interactive client forms in feature components.
- `date-fns` 4.1.0 - Booking/calendar formatting and date calculations.
- `@tanstack/react-table` 8.21.3 - Admin tables and report views.
- `zustand` 5.0.14 - Small client-side loading store in `lib/store/use-loading-store.ts`.

**UI:**
- `@base-ui/react` 1.4.1 - Accessible headless UI behavior used by shared controls.
- `shadcn` 4.6.0, `class-variance-authority`, `clsx`, and `tailwind-merge` - UI primitive and variant composition under `components/ui/`.
- `lucide-react` 1.14.0 - Application icons.
- `sonner` 2.0.7 - Toast notifications.
- `next-themes` 0.4.6, `next-view-transitions` 0.3.5, and `nextjs-toploader` 3.9.17 - Theme, transition, and route-progress behavior in `app/layout.tsx`.

**Infrastructure:**
- `resend` 6.12.2 - Resend email provider adapter in `lib/email/provider.ts`.
- `nodemailer` 8.0.7 - SMTP provider adapter in `lib/email/providers/smtp.ts`.
- Node `crypto` - AES-256-GCM protection for delegated Microsoft calendar tokens in `lib/integrations/microsoft-365-calendar/delegated.ts`.

## Configuration

**Environment:**
- Public configuration is read from `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`config/app.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`).
- Server-only credentials include `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, email provider credentials, Microsoft Graph credentials, delegated token encryption key, and n8n webhook secret (`lib/supabase/admin.ts`, `app/api/cron/`, `lib/email/`, `lib/integrations/microsoft-365-calendar/`).
- Runtime business defaults come from `APP_NAME`, `COMPANY_NAME`, `SYSTEM_CONTACT_EMAIL`, and `APP_TIMEZONE`, then database-backed `system_settings` override/fill behavior through `lib/settings/queries.ts`.
- Environment template files exist for local and Vercel setup. Never expose server-only values through `NEXT_PUBLIC_*`, Client Components, or database settings.

**Build:**
- `next.config.ts` - Minimal typed Next.js configuration; no Cache Components, static export, custom adapter, or image-host overrides are enabled.
- `tsconfig.json` - Strict TypeScript, bundler module resolution, JSX transform, incremental builds, and `@/*` -> project-root alias.
- `postcss.config.mjs` - Tailwind CSS 4 PostCSS plugin.
- `eslint.config.mjs` - Next.js Core Web Vitals and TypeScript lint profiles.
- `vitest.config.ts` and `playwright.config.ts` - Test runners.
- `proxy.ts` - Next.js 16 request proxy; implementation is delegated to `lib/supabase/middleware.ts`.
- Before changing Next.js APIs or conventions, read the matching 16.2.4 guide under `node_modules/next/dist/docs/` as required by `AGENTS.md`.

## Platform Requirements

**Development:**
- Windows, macOS, or Linux with Node.js 22.x and npm.
- A Supabase project or local Supabase stack with migrations in `supabase/migrations/` applied in numeric order.
- Use `npm run dev` for the app; use `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run e2e` for verification.
- Playwright browser binaries and dedicated test accounts are required for authenticated E2E coverage.

**Production:**
- Vercel is the documented deployment target (`docs/DEPLOYMENT_NOTES.md`); use the normal Next.js server deployment, not static export.
- Supabase provides hosted Auth, PostgreSQL, RLS, and private Storage.
- Node-compatible server execution is required by Nodemailer and `node:crypto` integration modules.
- External scheduling is required to invoke the protected email processor and reminder Route Handlers; `vercel.json` currently does not declare schedules.

---

*Stack analysis: 2026-07-15*
*Update after major dependency, runtime, or deployment changes.*
