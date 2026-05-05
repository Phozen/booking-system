create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_email_idx on public.profiles(email);

create index if not exists facilities_status_idx on public.facilities(status);
create index if not exists facilities_type_idx on public.facilities(type);
create index if not exists facilities_level_idx on public.facilities(level);
create index if not exists facilities_display_order_idx on public.facilities(display_order);

create index if not exists facility_photos_facility_id_idx on public.facility_photos(facility_id);
create index if not exists facility_photos_primary_idx on public.facility_photos(facility_id, is_primary);

create unique index if not exists facility_photos_one_primary_per_facility_idx
on public.facility_photos(facility_id)
where is_primary = true;

create index if not exists equipment_is_active_idx on public.equipment(is_active);

create index if not exists facility_equipment_facility_id_idx on public.facility_equipment(facility_id);
create index if not exists facility_equipment_equipment_id_idx on public.facility_equipment(equipment_id);

create index if not exists bookings_facility_id_idx on public.bookings(facility_id);
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_starts_at_idx on public.bookings(starts_at);
create index if not exists bookings_ends_at_idx on public.bookings(ends_at);
create index if not exists bookings_facility_status_time_idx on public.bookings(facility_id, status, starts_at, ends_at);
create index if not exists bookings_time_range_gist_idx on public.bookings using gist(time_range);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_no_overlapping_active'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
    add constraint bookings_no_overlapping_active
    exclude using gist (
      facility_id with =,
      time_range with &&
    )
    where (status in ('pending', 'confirmed'));
  end if;
end $$;

create index if not exists booking_approvals_booking_id_idx on public.booking_approvals(booking_id);
create index if not exists booking_approvals_status_idx on public.booking_approvals(status);
create index if not exists booking_approvals_requested_by_idx on public.booking_approvals(requested_by);
create index if not exists booking_approvals_reviewed_by_idx on public.booking_approvals(reviewed_by);

create index if not exists blocked_periods_scope_idx on public.blocked_periods(scope);
create index if not exists blocked_periods_active_idx on public.blocked_periods(is_active);
create index if not exists blocked_periods_time_range_gist_idx on public.blocked_periods using gist(time_range);

create index if not exists blocked_period_facilities_blocked_period_id_idx
on public.blocked_period_facilities(blocked_period_id);

create index if not exists blocked_period_facilities_facility_id_idx
on public.blocked_period_facilities(facility_id);

create index if not exists maintenance_closures_facility_id_idx on public.maintenance_closures(facility_id);
create index if not exists maintenance_closures_status_idx on public.maintenance_closures(status);
create index if not exists maintenance_closures_time_range_gist_idx on public.maintenance_closures using gist(time_range);

create index if not exists email_notifications_status_idx on public.email_notifications(status);
create index if not exists email_notifications_type_idx on public.email_notifications(type);
create index if not exists email_notifications_scheduled_for_idx on public.email_notifications(scheduled_for);
create index if not exists email_notifications_related_booking_id_idx on public.email_notifications(related_booking_id);
create index if not exists email_notifications_recipient_user_id_idx on public.email_notifications(recipient_user_id);

create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_entity_type_idx on public.audit_logs(entity_type);
create index if not exists audit_logs_entity_id_idx on public.audit_logs(entity_id);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at);

create index if not exists export_logs_report_type_idx on public.export_logs(report_type);
create index if not exists export_logs_exported_by_idx on public.export_logs(exported_by);
create index if not exists export_logs_created_at_idx on public.export_logs(created_at);
