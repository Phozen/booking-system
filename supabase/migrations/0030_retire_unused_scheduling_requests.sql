do $$
begin
  if to_regclass('public.booking_waitlist_requests') is not null
    and to_regclass('public.retired_scheduling_requests') is null then
    alter table public.booking_waitlist_requests
      rename to retired_scheduling_requests;
  end if;
end
$$;

revoke all on table public.retired_scheduling_requests from anon, authenticated;

alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_requests_pkey
  to retired_scheduling_requests_pkey;
alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_requests_requester_id_fkey
  to retired_scheduling_requests_requester_id_fkey;
alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_requests_facility_id_fkey
  to retired_scheduling_requests_facility_id_fkey;
alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_requests_reviewed_by_fkey
  to retired_scheduling_requests_reviewed_by_fkey;
alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_requests_attendee_count_check
  to retired_scheduling_requests_attendee_count_check;
alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_valid_time_range
  to retired_scheduling_request_valid_time_range;
alter table public.retired_scheduling_requests
  rename constraint booking_waitlist_status_check
  to retired_scheduling_request_status_check;

alter index if exists public.booking_waitlist_requester_id_idx
  rename to retired_scheduling_requester_id_idx;
alter index if exists public.booking_waitlist_facility_id_idx
  rename to retired_scheduling_facility_id_idx;
alter index if exists public.booking_waitlist_status_idx
  rename to retired_scheduling_status_idx;
alter index if exists public.booking_waitlist_requested_starts_at_idx
  rename to retired_scheduling_requested_starts_at_idx;

alter trigger set_booking_waitlist_requests_updated_at
  on public.retired_scheduling_requests
  rename to set_retired_scheduling_requests_updated_at;

drop policy if exists "Users can view their own waitlist requests"
  on public.retired_scheduling_requests;
drop policy if exists "Active users can create own waitlist requests"
  on public.retired_scheduling_requests;
drop policy if exists "Users can cancel own open waitlist requests"
  on public.retired_scheduling_requests;
drop policy if exists "Admins can manage waitlist requests"
  on public.retired_scheduling_requests;

comment on table public.retired_scheduling_requests is
  'Historical scheduling request records retained after the feature was retired. Application roles have no access.';
