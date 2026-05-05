-- Safe read-only verification for the five seeded facilities.
-- Run in Supabase SQL Editor after migrations and seed data are applied.

select
  code,
  name,
  slug,
  level,
  type,
  capacity,
  status,
  requires_approval,
  is_archived,
  display_order
from public.facilities
where code in ('MR-L5-01', 'MR-L5-02', 'MR-L6-01', 'MR-L6-02', 'EH-L1-01')
order by display_order;

select
  count(*) as default_facility_count
from public.facilities
where code in ('MR-L5-01', 'MR-L5-02', 'MR-L6-01', 'MR-L6-02', 'EH-L1-01');
