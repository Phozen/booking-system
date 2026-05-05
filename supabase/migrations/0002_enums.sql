do $$
begin
  create type public.user_role as enum ('employee', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_status as enum ('active', 'disabled', 'pending');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.facility_type as enum ('meeting_room', 'event_hall');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.facility_status as enum (
    'active',
    'inactive',
    'under_maintenance',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum (
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'completed',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.blocked_period_scope as enum (
    'all_facilities',
    'selected_facilities'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.maintenance_status as enum (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.email_notification_status as enum (
    'queued',
    'sending',
    'sent',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.email_notification_type as enum (
    'booking_confirmation',
    'booking_approval',
    'booking_rejection',
    'booking_cancellation',
    'booking_reminder'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audit_action_type as enum (
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'cancel',
    'login',
    'logout',
    'export',
    'role_change',
    'settings_change'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audit_entity_type as enum (
    'user',
    'facility',
    'booking',
    'booking_approval',
    'blocked_period',
    'maintenance_closure',
    'email_notification',
    'system_setting',
    'report',
    'auth'
  );
exception
  when duplicate_object then null;
end $$;
