-- Reminders: only 1 hour before start (drop the previous 1-day offset).
update public.system_settings
set
  value = '[60]'::jsonb,
  updated_at = now()
where key = 'reminder_offsets_minutes';
