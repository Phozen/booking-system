insert into public.system_settings (key, value, description, is_public)
values
  ('booking_window_start', '"08:00"'::jsonb, 'Earliest time of day users can start a booking.', true),
  ('booking_window_end', '"19:00"'::jsonb, 'Latest time of day users can end a booking.', true)
on conflict (key) do update
set
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();
