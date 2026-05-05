-- Phase 14 security hardening.
-- Employee booking creation must go through public.create_booking(), which
-- performs active-user, facility, blocked-period, maintenance, and conflict
-- checks before the exclusion constraint provides the final race-condition
-- guard. Do not allow direct employee inserts into public.bookings.

drop policy if exists "Active users can create own bookings" on public.bookings;

drop policy if exists "Users can update their own bookings for cancellation" on public.bookings;
create policy "Users can update their own bookings for cancellation"
on public.bookings
for update
using (
  public.is_active_user()
  and user_id = auth.uid()
  and status in ('pending', 'confirmed')
)
with check (
  public.is_active_user()
  and user_id = auth.uid()
  and status = 'cancelled'
  and cancelled_by = auth.uid()
  and cancelled_at is not null
);

drop policy if exists "Users can update their own basic profile" on public.profiles;
create policy "Users can update their own basic profile"
on public.profiles
for update
using (
  public.is_active_user()
  and id = auth.uid()
)
with check (
  public.is_active_user()
  and id = auth.uid()
);
