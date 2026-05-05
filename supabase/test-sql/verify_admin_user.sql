-- Safe read-only admin profile verification.
-- Expected: at least one active admin before testing admin pages.

select
  id,
  email,
  full_name,
  role,
  status,
  created_at,
  updated_at
from public.profiles
where role = 'admin'
order by created_at desc;

select
  count(*) as active_admin_count
from public.profiles
where role = 'admin'
  and status = 'active';
