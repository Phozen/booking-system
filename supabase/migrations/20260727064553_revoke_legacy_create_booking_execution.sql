-- The legacy create_booking overloads are implementation details called by the
-- guarded participant-aware booking RPC. They must not be exposed through the
-- Data API because the wrapper owns the active-user, participant, and
-- department validation contract.
revoke all on function public.create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean
) from public, anon, authenticated, service_role;

revoke all on function public.create_booking(
  uuid,
  uuid,
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz,
  boolean,
  boolean,
  text,
  integer,
  text,
  text,
  text
) from public, anon, authenticated, service_role;
