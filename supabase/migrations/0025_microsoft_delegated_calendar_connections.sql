create table if not exists public.microsoft_calendar_connections (
  user_id uuid primary key
    references public.profiles(id) on delete cascade,
  microsoft_email text not null,
  microsoft_tenant_id text,
  microsoft_account_id text,
  scopes text[] not null default '{}',
  encrypted_access_token text,
  encrypted_refresh_token text,
  access_token_expires_at timestamptz,
  status text not null default 'connected',
  last_connected_at timestamptz,
  last_refreshed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint microsoft_calendar_connections_status_check
    check (status in ('connected', 'reconnect_required')),
  constraint microsoft_calendar_connections_last_error_length
    check (last_error is null or char_length(last_error) <= 2000)
);

create index if not exists microsoft_calendar_connections_email_idx
on public.microsoft_calendar_connections(microsoft_email);

create index if not exists microsoft_calendar_connections_status_idx
on public.microsoft_calendar_connections(status);

drop trigger if exists set_microsoft_calendar_connections_updated_at
on public.microsoft_calendar_connections;
create trigger set_microsoft_calendar_connections_updated_at
before update on public.microsoft_calendar_connections
for each row execute function public.set_updated_at();

alter table public.microsoft_calendar_connections enable row level security;

revoke all on public.microsoft_calendar_connections from anon;
revoke all on public.microsoft_calendar_connections from authenticated;
grant select, insert, update, delete on public.microsoft_calendar_connections to service_role;

comment on table public.microsoft_calendar_connections is
  'Server-only encrypted delegated Microsoft Graph calendar tokens for booking-owner calendar sync.';

comment on column public.microsoft_calendar_connections.encrypted_access_token is
  'AES-256-GCM encrypted Microsoft delegated access token. Never expose to clients, logs, audit records, or sync errors.';

comment on column public.microsoft_calendar_connections.encrypted_refresh_token is
  'AES-256-GCM encrypted Microsoft delegated refresh token. Never expose to clients, logs, audit records, or sync errors.';
