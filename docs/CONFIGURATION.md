# Configuration

## Configuration files

Copy `.env.example` to `.env.local` for local work. `.env.local` is ignored by Git and must never be committed.

```powershell
Copy-Item .env.example .env.local
```

The example file is the canonical list of supported variables. Empty optional values keep related integrations disabled or fail safely when used.

## Required application and Supabase variables

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL used in links/callbacks | Browser-visible |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Browser-visible |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Browser-visible |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged Supabase client | Secret |
| `APP_TIMEZONE` | Application display/formatting timezone | Server |
| `APP_NAME` | Application name | Server |
| `COMPANY_NAME` | Organisation name | Server |
| `SYSTEM_CONTACT_EMAIL` | Support/contact email | Server |

`NEXT_PUBLIC_*` values may be included in client-side JavaScript. Do not place secrets in variables with this prefix.

## Email and cron

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Bearer secret for protected email cron endpoints |
| `EMAIL_PROVIDER` | Blank, `none`, `resend`, or `smtp` |
| `EMAIL_API_KEY` | Resend API key when using Resend |
| `EMAIL_FROM` | Verified sender identity |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server connection |
| `SMTP_SECURE`, `SMTP_REQUIRE_TLS` | SMTP transport flags |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials |

The application’s primary automated route is `GET /api/cron/email/run`. Call it with `Authorization: Bearer ${CRON_SECRET}`. Do not expose the secret to browser code, screenshots, or logs.

## Microsoft and n8n calendar integration

Calendar sync is optional and disabled by default. It is one-way outbound sync only.

| Variable group | Purpose |
| --- | --- |
| `CALENDAR_SYNC_PROVIDER` | `disabled`, `microsoft_graph`, or `n8n_webhook` |
| `MICROSOFT_365_CALENDAR_SYNC_ENABLED` | Enables Microsoft calendar processing when set to `true` |
| `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | Microsoft Entra credentials |
| `MICROSOFT_DEFAULT_CALENDAR_ID` | Calendar/mailbox target for central-calendar mode |
| `MICROSOFT_SYNC_MODE` | `disabled`, `central_calendar`, `booking_owner_calendar`, or configured provider mode |
| `MICROSOFT_GRAPH_AUTH_MODE` | `app_only` or `delegated` |
| `MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY` | Required for delegated token storage |
| `MICROSOFT_GRAPH_BASE_URL` | Microsoft Graph base URL |
| `N8N_CALENDAR_SYNC_ENABLED` | Enables the n8n provider |
| `N8N_CALENDAR_CREATE_WEBHOOK_URL` | Required n8n create endpoint |
| `N8N_CALENDAR_UPDATE_WEBHOOK_URL`, `N8N_CALENDAR_DELETE_WEBHOOK_URL` | Optional lifecycle endpoints |
| `N8N_CALENDAR_WEBHOOK_SECRET` | Server-only header secret for n8n |

Keep all provider secrets server-only. Follow [Microsoft 365 Calendar Sync](MICROSOFT_365_CALENDAR_SYNC.md) for integration design, external prerequisites, and safe testing.

## Browser testing variables

| Variable | Purpose |
| --- | --- |
| `E2E_BASE_URL` | Existing environment to test; local server starts when blank |
| `E2E_EMPLOYEE_STORAGE_STATE` | Ignored Playwright storage-state path for an employee |
| `E2E_ADMIN_STORAGE_STATE` | Ignored Playwright storage-state path for an admin |
| `E2E_SUPER_ADMIN_STORAGE_STATE` | Ignored Playwright storage-state path for a Super Admin |

Treat browser storage state as a bearer credential. Keep it outside the repository or in an ignored directory, revoke it after testing, and never share it in documentation or commits.

## Environment separation

- **Local:** use `.env.local`, `http://localhost:3000`, and a non-production Supabase project where possible.
- **Preview:** use a controlled preview URL and test-specific data/identities. Configure Supabase redirect URLs accordingly.
- **Production:** set secrets in the deployment platform, use the canonical HTTPS URL, and use the production Supabase project only after release approval.

<!-- VERIFY: Confirm production variable values, Supabase Auth redirect URLs, calendar permissions, email sender verification, and cron scheduling in the actual environment. -->
