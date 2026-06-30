-- Email queue reliability foundation for future automated processing.
-- Runtime behavior remains unchanged until the TypeScript processor is wired
-- to these service-role-only RPCs.

alter table public.email_notifications
  add column if not exists sending_started_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists idempotency_key text;

create index if not exists email_notifications_due_claim_idx
on public.email_notifications(scheduled_for, attempts)
where status = 'queued';

create index if not exists email_notifications_stale_sending_idx
on public.email_notifications(sending_started_at)
where status = 'sending';

create unique index if not exists email_notifications_idempotency_key_idx
on public.email_notifications(idempotency_key)
where idempotency_key is not null;

create or replace function public.sanitize_email_queue_error(p_error text)
returns text
language sql
immutable
as $$
  select nullif(
    left(
      regexp_replace(coalesce(p_error, 'Email delivery failed.'), '[[:cntrl:]]+', ' ', 'g'),
      2000
    ),
    ''
  );
$$;

revoke all on function public.sanitize_email_queue_error(text)
from public, anon, authenticated, service_role;

create or replace function public.claim_email_notifications(
  p_limit integer default 25,
  p_stale_after interval default interval '15 minutes'
)
returns table (
  id uuid,
  type public.email_notification_type,
  recipient_email text,
  recipient_name text,
  subject text,
  body text,
  template_data jsonb,
  related_booking_id uuid,
  provider text,
  attempts integer,
  max_attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_stale_after interval := coalesce(p_stale_after, interval '15 minutes');
begin
  update public.email_notifications en
  set
    status = 'failed',
    failed_at = now(),
    sending_started_at = null,
    last_error = coalesce(
      en.last_error,
      'Email send timed out and maximum attempts were reached.'
    ),
    updated_at = now()
  where en.status = 'sending'
    and en.sending_started_at is not null
    and en.sending_started_at <= now() - v_stale_after
    and en.attempts >= en.max_attempts;

  update public.email_notifications en
  set
    status = 'queued',
    sending_started_at = null,
    scheduled_for = now(),
    last_error = coalesce(en.last_error, 'Email send timed out and was queued for retry.'),
    updated_at = now()
  where en.status = 'sending'
    and en.sending_started_at is not null
    and en.sending_started_at <= now() - v_stale_after
    and en.attempts < en.max_attempts;

  return query
  with due as (
    select en.id
    from public.email_notifications en
    where en.status = 'queued'
      and en.scheduled_for <= now()
      and en.attempts < en.max_attempts
    order by en.scheduled_for asc, en.created_at asc
    for update skip locked
    limit v_limit
  ),
  claimed as (
    update public.email_notifications en
    set
      status = 'sending',
      attempts = en.attempts + 1,
      sending_started_at = now(),
      last_error = null,
      updated_at = now()
    from due
    where en.id = due.id
    returning
      en.id,
      en.type,
      en.recipient_email,
      null::text as recipient_name,
      en.subject,
      en.body,
      en.template_data,
      en.related_booking_id,
      en.provider,
      en.attempts,
      en.max_attempts
  )
  select
    claimed.id,
    claimed.type,
    claimed.recipient_email,
    claimed.recipient_name,
    claimed.subject,
    claimed.body,
    claimed.template_data,
    claimed.related_booking_id,
    claimed.provider,
    claimed.attempts,
    claimed.max_attempts
  from claimed
  order by claimed.attempts asc, claimed.id;
end;
$$;

revoke all on function public.claim_email_notifications(integer, interval)
from public, anon, authenticated, service_role;

grant execute on function public.claim_email_notifications(integer, interval)
to service_role;

create or replace function public.mark_email_notification_sent(
  p_email_id uuid,
  p_provider text,
  p_provider_message_id text default null
)
returns public.email_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.email_notifications;
begin
  update public.email_notifications
  set
    status = 'sent',
    provider = nullif(trim(p_provider), ''),
    provider_message_id = nullif(trim(p_provider_message_id), ''),
    sent_at = now(),
    failed_at = null,
    sending_started_at = null,
    last_error = null,
    updated_at = now()
  where id = p_email_id
    and status = 'sending'
  returning *
  into v_row;

  return v_row;
end;
$$;

revoke all on function public.mark_email_notification_sent(uuid, text, text)
from public, anon, authenticated, service_role;

grant execute on function public.mark_email_notification_sent(uuid, text, text)
to service_role;

create or replace function public.mark_email_notification_failed(
  p_email_id uuid,
  p_error text,
  p_retry_at timestamptz default null
)
returns public.email_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.email_notifications;
  v_row public.email_notifications;
  v_error text := coalesce(
    public.sanitize_email_queue_error(p_error),
    'Email delivery failed.'
  );
begin
  select *
  into v_existing
  from public.email_notifications
  where id = p_email_id
    and status = 'sending'
  for update;

  if not found then
    return null;
  end if;

  if v_existing.attempts >= v_existing.max_attempts or p_retry_at is null then
    update public.email_notifications
    set
      status = 'failed',
      failed_at = now(),
      sending_started_at = null,
      last_error = v_error,
      updated_at = now()
    where id = p_email_id
    returning *
    into v_row;
  else
    update public.email_notifications
    set
      status = 'queued',
      scheduled_for = p_retry_at,
      sending_started_at = null,
      last_error = v_error,
      updated_at = now()
    where id = p_email_id
    returning *
    into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.mark_email_notification_failed(uuid, text, timestamptz)
from public, anon, authenticated, service_role;

grant execute on function public.mark_email_notification_failed(uuid, text, timestamptz)
to service_role;
