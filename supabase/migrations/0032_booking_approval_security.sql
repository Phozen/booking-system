-- Qbook production stabilization: enforce booking approval policy in PostgreSQL.
--
-- Creation RPCs are replaced below so caller-supplied approval flags can never
-- weaken the effective facility/system policy.

create or replace function public.get_effective_booking_approval_required(
  p_facility_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_default_required boolean := false;
  v_allow_facility_override boolean := true;
  v_facility_required boolean;
begin
  select case
    when jsonb_typeof(ss.value) = 'boolean' then (ss.value #>> '{}')::boolean
    else false
  end
  into v_default_required
  from public.system_settings ss
  where ss.key = 'default_approval_required';

  v_default_required := coalesce(v_default_required, false);

  select case
    when jsonb_typeof(ss.value) = 'boolean' then (ss.value #>> '{}')::boolean
    else null
  end
  into v_allow_facility_override
  from public.system_settings ss
  where ss.key in (
    'facility_approval_override_enabled',
    'allow_facility_approval_override'
  )
  order by case ss.key
    when 'facility_approval_override_enabled' then 0
    else 1
  end
  limit 1;

  v_allow_facility_override := coalesce(v_allow_facility_override, true);

  select f.requires_approval
  into v_facility_required
  from public.facilities f
  where f.id = p_facility_id;

  if not found then
    raise exception 'Facility not found.';
  end if;

  if v_allow_facility_override and v_facility_required is not null then
    return v_facility_required;
  end if;

  return v_default_required;
end;
$$;

revoke all on function public.get_effective_booking_approval_required(uuid)
from public, anon, authenticated, service_role;

create or replace function public.enforce_booking_approval_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required boolean;
  v_expected_status public.booking_status;
begin
  v_required := public.get_effective_booking_approval_required(new.facility_id);
  v_expected_status := case when v_required then 'pending' else 'confirmed' end;

  if new.approval_required is distinct from v_required then
    raise exception
      'Booking approval requirement does not match the effective database policy.';
  end if;

  if new.status is distinct from v_expected_status then
    raise exception
      'Booking status does not match the effective database approval policy.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_booking_approval_on_insert on public.bookings;
create trigger enforce_booking_approval_on_insert
before insert on public.bookings
for each row execute function public.enforce_booking_approval_on_insert();

revoke all on function public.enforce_booking_approval_on_insert()
from public, anon, authenticated, service_role;

create or replace function public.enforce_booking_approval_review_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting(
    'booking_system.allow_booking_approval_review',
    true
  ) = 'on' then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.remarks is distinct from old.remarks
  then
    raise exception 'Booking approvals must be reviewed through the guarded RPC.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_booking_approval_review_mutation
on public.booking_approvals;
create trigger enforce_booking_approval_review_mutation
before update on public.booking_approvals
for each row execute function public.enforce_booking_approval_review_mutation();

revoke all on function public.enforce_booking_approval_review_mutation()
from public, anon, authenticated, service_role;

create or replace function public.review_booking_approval(
  p_booking_id uuid,
  p_decision public.approval_status,
  p_remarks text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_approval public.booking_approvals;
  v_pending_approval_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only active admins can review booking approvals.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Approval decision must be approved or rejected.';
  end if;

  if length(coalesce(p_remarks, '')) > 2000 then
    raise exception 'Approval remarks are too long.';
  end if;

  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not v_booking.approval_required or v_booking.status <> 'pending' then
    raise exception 'Only pending approval-required bookings can be reviewed.';
  end if;

  select count(*)
  into v_pending_approval_count
  from public.booking_approvals ba
  where ba.booking_id = p_booking_id
    and ba.status = 'pending';

  if v_pending_approval_count <> 1 then
    raise exception 'Booking must have exactly one pending approval record.';
  end if;

  select *
  into v_approval
  from public.booking_approvals ba
  where ba.booking_id = p_booking_id
    and ba.status = 'pending'
  for update;

  if p_decision = 'approved' then
    perform public.validate_booking_mutation_input(
      v_booking.facility_id,
      v_booking.user_id,
      v_booking.attendee_count,
      v_booking.starts_at,
      v_booking.ends_at,
      v_booking.catering_required,
      v_booking.catering_type,
      v_booking.catering_pax,
      v_booking.catering_serving_time
    );

    if exists (
      select 1
      from public.bookings conflict
      where conflict.facility_id = v_booking.facility_id
        and conflict.id <> v_booking.id
        and conflict.status in ('pending', 'confirmed')
        and conflict.time_range && v_booking.time_range
    ) then
      raise exception 'Booking conflicts with another active booking.'
        using errcode = '23P01';
    end if;
  end if;

  perform set_config(
    'booking_system.allow_booking_approval_review',
    'on',
    true
  );
  perform set_config('booking_system.allow_booking_mutation', 'on', true);

  update public.booking_approvals
  set
    status = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    remarks = nullif(trim(p_remarks), '')
  where id = v_approval.id;

  update public.bookings
  set status = case
    when p_decision = 'approved' then 'confirmed'::public.booking_status
    else 'rejected'::public.booking_status
  end
  where id = v_booking.id
  returning * into v_booking;

  perform set_config(
    'booking_system.allow_booking_approval_review',
    'off',
    true
  );
  perform set_config('booking_system.allow_booking_mutation', 'off', true);

  return v_booking;
end;
$$;

revoke all on function public.review_booking_approval(
  uuid,
  public.approval_status,
  text
) from public, anon, authenticated, service_role;
grant execute on function public.review_booking_approval(
  uuid,
  public.approval_status,
  text
) to authenticated;

-- Authenticated users may read rows allowed by RLS, but booking creation and
-- approval mutation are RPC-only. The service role remains reserved for
-- trusted server processes and is still constrained by the transition trigger.
revoke insert, delete on table public.bookings from authenticated;
revoke insert, update, delete on table public.booking_approvals from authenticated;

drop policy if exists "Active users can create own bookings" on public.bookings;
drop policy if exists "Admins can manage all bookings" on public.bookings;
drop policy if exists "Admins can manage booking approvals"
on public.booking_approvals;

-- An Admin who owns a booking must not gain a direct-table escape from the
-- cancellation-only employee policy.
create or replace function public.prevent_unsafe_user_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('booking_system.allow_booking_mutation', true) = 'on' then
    return new;
  end if;

  if auth.uid() = old.user_id then
    if old.status not in ('pending', 'confirmed') or new.status <> 'cancelled' then
      raise exception 'Users can only cancel their own active bookings.';
    end if;

    if new.cancelled_by is distinct from auth.uid()
      or new.cancelled_at is null
      or length(coalesce(new.cancellation_reason, '')) > 2000
    then
      raise exception 'Booking cancellation metadata is invalid.';
    end if;

    if new.facility_id is distinct from old.facility_id
      or new.user_id is distinct from old.user_id
      or new.created_by is distinct from old.created_by
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.attendee_count is distinct from old.attendee_count
      or new.starts_at is distinct from old.starts_at
      or new.ends_at is distinct from old.ends_at
      or new.approval_required is distinct from old.approval_required
      or new.completed_at is distinct from old.completed_at
      or new.metadata is distinct from old.metadata
      or new.catering_required is distinct from old.catering_required
      or new.catering_type is distinct from old.catering_type
      or new.catering_pax is distinct from old.catering_pax
      or new.catering_serving_time is distinct from old.catering_serving_time
      or new.catering_dietary_notes is distinct from old.catering_dietary_notes
      or new.catering_notes is distinct from old.catering_notes
      or new.usage_status is distinct from old.usage_status
      or new.checked_in_at is distinct from old.checked_in_at
      or new.checked_in_by is distinct from old.checked_in_by
      or new.no_show_marked_at is distinct from old.no_show_marked_at
      or new.no_show_marked_by is distinct from old.no_show_marked_by
      or new.recurrence_series_id is distinct from old.recurrence_series_id
      or new.recurrence_sequence is distinct from old.recurrence_sequence
    then
      raise exception 'Users cannot edit booking details during cancellation.';
    end if;

    return new;
  end if;

  raise exception 'Booking updates must use an authorized mutation RPC.';
end;
$$;

create or replace function public.update_booking_catering(
  p_booking_id uuid,
  p_catering_required boolean,
  p_catering_type text default null,
  p_catering_pax integer default null,
  p_catering_serving_time text default null,
  p_catering_dietary_notes text default null,
  p_catering_notes text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if not public.is_active_user() then
    raise exception 'Only active users can update booking catering.';
  end if;

  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Users can update catering only for their own bookings.';
  end if;

  if not public.is_admin()
    and v_booking.status not in ('pending', 'confirmed')
  then
    raise exception 'Catering can only be changed for active bookings.';
  end if;

  if coalesce(p_catering_required, false) then
    if p_catering_type is null or p_catering_serving_time is null then
      raise exception 'Catering type and serving time are required.';
    end if;

    if p_catering_pax is null or p_catering_pax <= 0 then
      raise exception 'Catering pax must be greater than zero.';
    end if;
  end if;

  perform set_config('booking_system.allow_booking_mutation', 'on', true);

  update public.bookings
  set
    catering_required = coalesce(p_catering_required, false),
    catering_type = case when p_catering_required then p_catering_type else null end,
    catering_pax = case when p_catering_required then p_catering_pax else null end,
    catering_serving_time = case when p_catering_required then p_catering_serving_time else null end,
    catering_dietary_notes = case when p_catering_required then nullif(trim(p_catering_dietary_notes), '') else null end,
    catering_notes = case when p_catering_required then nullif(trim(p_catering_notes), '') else null end
  where id = v_booking.id
  returning * into v_booking;

  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  return v_booking;
end;
$$;

revoke all on function public.update_booking_catering(
  uuid,
  boolean,
  text,
  integer,
  text,
  text,
  text
) from public, anon, authenticated, service_role;
grant execute on function public.update_booking_catering(
  uuid,
  boolean,
  text,
  integer,
  text,
  text,
  text
) to authenticated;

create or replace function public.cancel_booking_as_admin(
  p_booking_id uuid,
  p_reason text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_pending_approval_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only active admins can cancel bookings as an admin.';
  end if;

  if length(coalesce(p_reason, '')) > 2000 then
    raise exception 'Cancellation reason is too long.';
  end if;

  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Only active bookings can be cancelled.';
  end if;

  if v_booking.approval_required and v_booking.status = 'pending' then
    select count(*)
    into v_pending_approval_count
    from public.booking_approvals ba
    where ba.booking_id = v_booking.id
      and ba.status = 'pending';

    if v_pending_approval_count <> 1 then
      raise exception 'Pending booking must have exactly one pending approval.';
    end if;
  end if;

  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  perform set_config(
    'booking_system.allow_booking_approval_review',
    'on',
    true
  );

  if v_booking.approval_required and v_booking.status = 'pending' then
    update public.booking_approvals
    set
      status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      remarks = coalesce(nullif(trim(p_reason), ''), 'Cancelled by an administrator.')
    where booking_id = v_booking.id
      and status = 'pending';
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_by = auth.uid(),
    cancelled_at = now(),
    cancellation_reason = nullif(trim(p_reason), '')
  where id = v_booking.id
  returning * into v_booking;

  perform set_config(
    'booking_system.allow_booking_approval_review',
    'off',
    true
  );
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  return v_booking;
end;
$$;

revoke all on function public.cancel_booking_as_admin(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function public.cancel_booking_as_admin(uuid, text)
to authenticated;

create or replace function public.update_booking_usage_as_admin(
  p_booking_id uuid,
  p_usage_status text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if not public.is_admin() then
    raise exception 'Only active admins can update booking usage.';
  end if;

  if p_usage_status not in ('not_tracked', 'checked_in', 'no_show') then
    raise exception 'Booking usage status is invalid.';
  end if;

  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status not in ('confirmed', 'completed', 'expired') then
    raise exception 'Usage can only be tracked for confirmed or historical bookings.';
  end if;

  perform set_config('booking_system.allow_booking_mutation', 'on', true);

  update public.bookings
  set
    usage_status = p_usage_status,
    checked_in_at = case when p_usage_status = 'checked_in' then now() else null end,
    checked_in_by = case when p_usage_status = 'checked_in' then auth.uid() else null end,
    no_show_marked_at = case when p_usage_status = 'no_show' then now() else null end,
    no_show_marked_by = case when p_usage_status = 'no_show' then auth.uid() else null end
  where id = v_booking.id
  returning * into v_booking;

  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  return v_booking;
end;
$$;

revoke all on function public.update_booking_usage_as_admin(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function public.update_booking_usage_as_admin(uuid, text)
to authenticated;

create or replace function public.cancel_own_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_pending_approval_count integer;
begin
  if not public.is_active_user() then
    raise exception 'Only active users can cancel bookings.';
  end if;

  if length(coalesce(p_reason, '')) > 2000 then
    raise exception 'Cancellation reason is too long.';
  end if;

  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found or v_booking.user_id <> auth.uid() then
    raise exception 'Users can only cancel their own bookings.';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Only active bookings can be cancelled.';
  end if;

  if v_booking.approval_required and v_booking.status = 'pending' then
    select count(*)
    into v_pending_approval_count
    from public.booking_approvals ba
    where ba.booking_id = v_booking.id
      and ba.status = 'pending';

    if v_pending_approval_count <> 1 then
      raise exception 'Pending booking must have exactly one pending approval.';
    end if;
  end if;

  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  perform set_config(
    'booking_system.allow_booking_approval_review',
    'on',
    true
  );

  if v_booking.approval_required and v_booking.status = 'pending' then
    update public.booking_approvals
    set
      status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      remarks = coalesce(nullif(trim(p_reason), ''), 'Cancelled by the booking owner.')
    where booking_id = v_booking.id
      and status = 'pending';
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_by = auth.uid(),
    cancelled_at = now(),
    cancellation_reason = nullif(trim(p_reason), '')
  where id = v_booking.id
  returning * into v_booking;

  perform set_config(
    'booking_system.allow_booking_approval_review',
    'off',
    true
  );
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
  return v_booking;
end;
$$;

revoke all on function public.cancel_own_booking(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function public.cancel_own_booking(uuid, text)
to authenticated;

create or replace function public.cancel_own_recurring_bookings(
  p_booking_id uuid,
  p_scope text
)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference public.bookings;
begin
  if not public.is_active_user() then
    raise exception 'Only active users can cancel recurring bookings.';
  end if;

  if p_scope not in ('future', 'series') then
    raise exception 'Recurring cancellation scope is invalid.';
  end if;

  select *
  into v_reference
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found
    or v_reference.user_id <> auth.uid()
    or v_reference.recurrence_series_id is null
  then
    raise exception 'Recurring booking series was not found for this user.';
  end if;

  perform 1
  from public.bookings b
  where b.user_id = auth.uid()
    and b.recurrence_series_id = v_reference.recurrence_series_id
    and b.status in ('pending', 'confirmed')
    and (p_scope = 'series' or b.starts_at >= v_reference.starts_at)
  for update;

  if exists (
    select 1
    from public.bookings b
    where b.user_id = auth.uid()
      and b.recurrence_series_id = v_reference.recurrence_series_id
      and b.status = 'pending'
      and b.approval_required
      and (p_scope = 'series' or b.starts_at >= v_reference.starts_at)
      and (
        select count(*)
        from public.booking_approvals ba
        where ba.booking_id = b.id
          and ba.status = 'pending'
      ) <> 1
  ) then
    raise exception 'Each pending booking must have exactly one pending approval.';
  end if;

  perform set_config('booking_system.allow_booking_mutation', 'on', true);
  perform set_config(
    'booking_system.allow_booking_approval_review',
    'on',
    true
  );

  update public.booking_approvals ba
  set
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    remarks = case
      when p_scope = 'future' then 'Future occurrence cancelled by the booking owner.'
      else 'Recurring series cancelled by the booking owner.'
    end
  from public.bookings b
  where ba.booking_id = b.id
    and ba.status = 'pending'
    and b.user_id = auth.uid()
    and b.recurrence_series_id = v_reference.recurrence_series_id
    and b.status = 'pending'
    and b.approval_required
    and (p_scope = 'series' or b.starts_at >= v_reference.starts_at);

  if p_scope = 'series' then
    update public.booking_recurrence_series
    set
      status = 'cancelled',
      cancelled_by = auth.uid(),
      cancelled_at = now()
    where id = v_reference.recurrence_series_id
      and owner_user_id = auth.uid();
  end if;

  return query
  update public.bookings b
  set
    status = 'cancelled',
    cancelled_by = auth.uid(),
    cancelled_at = now(),
    cancellation_reason = case
      when p_scope = 'future' then 'Recurring booking future occurrences cancelled by owner.'
      else 'Recurring booking series cancelled by owner.'
    end
  where b.user_id = auth.uid()
    and b.recurrence_series_id = v_reference.recurrence_series_id
    and b.status in ('pending', 'confirmed')
    and (p_scope = 'series' or b.starts_at >= v_reference.starts_at)
  returning b.*;

  perform set_config(
    'booking_system.allow_booking_approval_review',
    'off',
    true
  );
  perform set_config('booking_system.allow_booking_mutation', 'off', true);
end;
$$;

revoke all on function public.cancel_own_recurring_bookings(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function public.cancel_own_recurring_bookings(uuid, text)
to authenticated;

revoke update on table public.bookings from authenticated;
revoke insert, update, delete on table public.booking_recurrence_series
from authenticated;

drop policy if exists "Users can update their own bookings for cancellation"
on public.bookings;
drop policy if exists "Active users can create own recurrence series"
on public.booking_recurrence_series;
drop policy if exists "Users can update their own active recurrence series"
on public.booking_recurrence_series;
drop policy if exists "Admins can manage recurrence series"
on public.booking_recurrence_series;

create or replace function public.enforce_recurring_series_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean := false;
begin
  select case
    when jsonb_typeof(ss.value) = 'boolean' then (ss.value #>> '{}')::boolean
    else false
  end
  into v_enabled
  from public.system_settings ss
  where ss.key = 'recurring_bookings_enabled';

  if not coalesce(v_enabled, false) then
    raise exception 'Recurring bookings are disabled.';
  end if;

  if auth.uid() is null
    or new.owner_user_id <> auth.uid()
    or new.created_by is distinct from auth.uid()
  then
    raise exception 'Users can create recurring series only for themselves.';
  end if;

  if new.ends_on is not null and new.ends_on < new.starts_on then
    raise exception 'Recurring booking end date cannot precede its start date.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_recurring_series_insert
on public.booking_recurrence_series;
create trigger enforce_recurring_series_insert
before insert on public.booking_recurrence_series
for each row execute function public.enforce_recurring_series_insert();

create or replace function public.validate_recurring_series_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_distinct_sequences integer;
  v_min_sequence integer;
  v_max_sequence integer;
begin
  select
    count(*),
    count(distinct b.recurrence_sequence),
    min(b.recurrence_sequence),
    max(b.recurrence_sequence)
  into
    v_count,
    v_distinct_sequences,
    v_min_sequence,
    v_max_sequence
  from public.bookings b
  where b.recurrence_series_id = new.id;

  if v_count = 0
    or new.occurrence_count is null
    or v_count <> new.occurrence_count
    or v_distinct_sequences <> v_count
    or v_min_sequence <> 1
    or v_max_sequence <> v_count
  then
    raise exception 'Recurring series occurrence metadata is inconsistent.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.recurrence_series_id = new.id
      and (
        b.user_id <> new.owner_user_id
        or b.facility_id <> new.facility_id
        or b.recurrence_sequence is null
      )
  ) then
    raise exception 'Recurring series occurrence ownership is inconsistent.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_recurring_series_integrity
on public.booking_recurrence_series;
create constraint trigger validate_recurring_series_integrity
after insert or update on public.booking_recurrence_series
deferrable initially deferred
for each row execute function public.validate_recurring_series_integrity();

revoke all on function public.enforce_recurring_series_insert()
from public, anon, authenticated, service_role;
revoke all on function public.validate_recurring_series_integrity()
from public, anon, authenticated, service_role;
