insert into public.system_settings (key, value, description, is_public)
values (
  'recurring_bookings_enabled',
  'false'::jsonb,
  'Whether employees can create recurring booking series.',
  false
)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  is_public = excluded.is_public;
