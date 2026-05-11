# Booking System

Internal company facility booking system built with Next.js, Supabase, and Resend-ready email notifications.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, RLS, and Storage
- Tailwind CSS and shadcn/ui-style components
- Vitest for focused unit tests
- Vercel for current deployment target

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`, then start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

Run the full verification stack before handoff or deployment:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run qa
```

## Deployment

Current deployment target is Vercel.

- Build command: `npm run build`
- Output directory: Vercel default
- Node.js: 22.x

See `docs/DEPLOYMENT_NOTES.md` and `docs/PRODUCTION_CHECKLIST.md` for environment variables, Supabase setup, first-admin promotion, storage checks, smoke tests, and rollback notes.
