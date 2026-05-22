insert into public.system_settings (key, value, description, is_public)
values (
  'calendar_visibility_mode',
  '"my_bookings_only"'::jsonb,
  'Controls who can view all-user bookings on calendar pages.',
  false
)
on conflict (key) do update
set
  value = case
    when public.system_settings.value = '"all_company_bookings"'::jsonb
      then '"all_users"'::jsonb
    when public.system_settings.value in (
      '"my_bookings_only"'::jsonb,
      '"admins_only"'::jsonb,
      '"all_users"'::jsonb
    )
      then public.system_settings.value
    else '"my_bookings_only"'::jsonb
  end,
  description = excluded.description;
