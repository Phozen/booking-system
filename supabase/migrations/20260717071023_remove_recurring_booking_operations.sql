-- Recurring booking data stays in place for audit, but all operational
-- entry points and configuration are removed after the completed retirement.
drop trigger if exists enforce_recurring_series_insert on public.booking_recurrence_series;
drop trigger if exists validate_recurring_series_integrity on public.booking_recurrence_series;

drop function if exists public.retire_future_recurring_bookings();
drop function if exists public.create_recurring_booking_series(
  uuid, uuid, text, text, integer, boolean, text, integer, date, date, integer, jsonb
);
drop function if exists public.cancel_own_recurring_bookings(uuid, text);
drop function if exists public.enforce_recurring_series_insert();
drop function if exists public.validate_recurring_series_integrity();

delete from public.system_settings where key = 'recurring_bookings_enabled';
