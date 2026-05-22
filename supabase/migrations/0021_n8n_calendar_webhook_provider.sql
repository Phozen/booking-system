alter table public.booking_calendar_syncs
  drop constraint if exists booking_calendar_syncs_provider_check;

alter table public.booking_calendar_syncs
  add constraint booking_calendar_syncs_provider_check
  check (provider in ('microsoft_365', 'n8n_webhook'));

comment on table public.booking_calendar_syncs is
  'Tracks outbound calendar sync attempts for Microsoft 365 Graph and temporary n8n webhook providers.';
