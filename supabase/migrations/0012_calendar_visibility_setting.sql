insert into public.system_settings (key, value, description, is_public)
values (
  'calendar_visibility_mode',
  '"my_bookings_only"'::jsonb,
  'Controls whether employees can view all company bookings on the employee calendar.',
  false
)
on conflict (key) do nothing;
