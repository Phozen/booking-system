-- Harden direct employee cancellation updates. Trusted booking mutation RPCs
-- still bypass this guard with the transaction-local
-- booking_system.allow_booking_mutation GUC.

create or replace function public.prevent_unsafe_user_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only trusted SECURITY DEFINER booking mutation RPCs set this local flag.
  -- The third set_config argument in those RPCs is true, so the bypass is
  -- scoped to the current transaction.
  if current_setting('booking_system.allow_booking_mutation', true) = 'on' then
    return new;
  end if;

  if auth.uid() = old.user_id and not public.is_admin() then
    if old.status not in ('pending', 'confirmed') or new.status <> 'cancelled' then
      raise exception 'Users can only cancel their own active bookings.';
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
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Users cannot edit booking details during cancellation.';
    end if;
  end if;

  return new;
end;
$$;
