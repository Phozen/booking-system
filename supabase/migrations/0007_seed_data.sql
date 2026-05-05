insert into public.facilities (
  code,
  name,
  slug,
  level,
  type,
  capacity,
  description,
  status,
  requires_approval,
  display_order
)
values
  (
    'MR-L5-01',
    'Meeting Room 1',
    'meeting-room-1-level-5',
    'Level 5',
    'meeting_room',
    8,
    'Meeting Room 1 located on Level 5.',
    'active',
    null,
    1
  ),
  (
    'MR-L5-02',
    'Meeting Room 2',
    'meeting-room-2-level-5',
    'Level 5',
    'meeting_room',
    8,
    'Meeting Room 2 located on Level 5.',
    'active',
    null,
    2
  ),
  (
    'MR-L6-01',
    'Meeting Room 1',
    'meeting-room-1-level-6',
    'Level 6',
    'meeting_room',
    8,
    'Meeting Room 1 located on Level 6.',
    'active',
    null,
    3
  ),
  (
    'MR-L6-02',
    'Meeting Room 2',
    'meeting-room-2-level-6',
    'Level 6',
    'meeting_room',
    8,
    'Meeting Room 2 located on Level 6.',
    'active',
    null,
    4
  ),
  (
    'EH-L1-01',
    'Event Hall',
    'event-hall-level-1',
    'Level 1',
    'event_hall',
    100,
    'Event Hall located on Level 1.',
    'active',
    null,
    5
  )
on conflict (code) do update
set
  name = excluded.name,
  slug = excluded.slug,
  level = excluded.level,
  type = excluded.type,
  capacity = excluded.capacity,
  description = excluded.description,
  status = excluded.status,
  requires_approval = excluded.requires_approval,
  display_order = excluded.display_order,
  is_archived = false,
  updated_at = now();

insert into public.equipment (name, description, icon_name)
values
  ('Projector', 'Projector for presentations', 'projector'),
  ('TV Screen', 'Display screen for presentations or video calls', 'tv'),
  ('Whiteboard', 'Whiteboard for discussions', 'rectangle-horizontal'),
  ('Video Conferencing System', 'Camera and conferencing equipment', 'video'),
  ('Microphone', 'Microphone for meetings or events', 'mic'),
  ('Speaker System', 'Audio speaker system', 'volume-2'),
  ('HDMI Cable', 'HDMI cable for display connection', 'cable'),
  ('Air Conditioning', 'Air-conditioned room', 'snowflake'),
  ('Tables', 'Tables available', 'table'),
  ('Chairs', 'Chairs available', 'armchair')
on conflict (name) do update
set
  description = excluded.description,
  icon_name = excluded.icon_name,
  is_active = true,
  updated_at = now();

insert into public.facility_equipment (facility_id, equipment_id, quantity)
select f.id, e.id, 1
from public.facilities f
join public.equipment e
  on e.name in (
    'TV Screen',
    'Whiteboard',
    'Video Conferencing System',
    'HDMI Cable',
    'Air Conditioning',
    'Tables',
    'Chairs'
  )
where f.code in ('MR-L5-01', 'MR-L5-02', 'MR-L6-01', 'MR-L6-02')
on conflict (facility_id, equipment_id) do nothing;

insert into public.facility_equipment (facility_id, equipment_id, quantity)
select f.id, e.id, 1
from public.facilities f
join public.equipment e
  on e.name in (
    'Projector',
    'Microphone',
    'Speaker System',
    'Air Conditioning',
    'Tables',
    'Chairs'
  )
where f.code = 'EH-L1-01'
on conflict (facility_id, equipment_id) do nothing;

insert into public.system_settings (
  key,
  value,
  description,
  is_public
)
values
  ('app_name', '"Booking System"'::jsonb, 'Application display name.', true),
  ('company_name', '""'::jsonb, 'Company display name.', true),
  ('system_contact_email', '""'::jsonb, 'Contact email shown for booking support.', true),
  ('registration_enabled', 'true'::jsonb, 'Whether employee self-registration is enabled.', false),
  ('allowed_email_domains', '[]'::jsonb, 'Allowed registration email domains. Empty means unrestricted until configured.', false),
  ('default_approval_required', 'false'::jsonb, 'Whether new bookings require approval by default.', false),
  ('facility_approval_override_enabled', 'true'::jsonb, 'Whether facilities can override the default approval setting.', false),
  ('reminder_offsets_minutes', '[1440, 60]'::jsonb, 'Reminder offsets before a confirmed booking starts.', false),
  ('default_timezone', '"Asia/Kuala_Lumpur"'::jsonb, 'Default timezone for displaying booking times.', true),
  ('cancellation_rules', '{}'::jsonb, 'Reserved for future cancellation policy settings.', false)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();
