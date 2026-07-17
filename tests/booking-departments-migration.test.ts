import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260717031145_booking_departments_and_recurring_retirement.sql",
  ),
  "utf8",
);
const bookingActions = readFileSync(
  join(process.cwd(), "lib/bookings/actions.ts"),
  "utf8",
);
const adminBookingActions = readFileSync(
  join(process.cwd(), "lib/admin/bookings/actions.ts"),
  "utf8",
);
const departmentNotifications = readFileSync(
  join(process.cwd(), "lib/departments/notifications.ts"),
  "utf8",
);
const bookingDetail = readFileSync(
  join(process.cwd(), "components/bookings/booking-detail.tsx"),
  "utf8",
);
const settingsForm = readFileSync(
  join(process.cwd(), "components/admin/settings/settings-form.tsx"),
  "utf8",
);

const sql = migration.replace(/\s+/g, " ").toLowerCase();
const employeeActions = bookingActions.replace(/\s+/g, " ").toLowerCase();
const adminActions = adminBookingActions.replace(/\s+/g, " ").toLowerCase();

describe("booking departments and recurring retirement migration", () => {
  it("creates an RLS-protected department directory with the inactive safe seed", () => {
    expect(sql).toContain("create table public.departments");
    expect(sql).toContain("constraint departments_email_unique unique (email)");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("super admins manage departments");
    expect(sql).toContain("'placeholder department', 'department@placeholder.invalid', false");
  });

  it("keeps booking department visibility tied to normal booking access", () => {
    expect(sql).toContain("create table public.booking_departments");
    expect(sql).toContain("primary key (booking_id, department_id)");
    expect(sql).toContain("booking viewers can view booking departments");
    expect(sql).toContain("b.user_id = auth.uid() or public.is_admin()");
    expect(sql).toContain("from public.booking_invitations bi");
  });

  it("uses guarded atomic RPCs for tags and initial attendees", () => {
    for (const rpc of [
      "set_booking_departments",
      "create_booking_with_participants",
      "admin_create_booking_with_participants",
    ]) {
      expect(sql).toContain(`create or replace function public.${rpc}`);
    }
    expect(sql).toContain("a department may only be tagged once");
    expect(sql).toContain("a user may only be invited once");
    expect(sql).toContain("booking owner cannot be invited");
    expect(sql).toContain("choose active departments only");
    expect(sql).toContain("choose active internal users only");
    expect(sql).toContain("grant execute on function public.admin_create_booking_with_participants");
    expect(sql).toContain("to service_role");
  });

  it("retires future recurring operations without deleting historical records", () => {
    expect(sql).toContain("revoke execute on function public.create_recurring_booking_series");
    expect(sql).toContain("revoke execute on function public.cancel_own_recurring_bookings");
    expect(sql).toContain("create or replace function public.retire_future_recurring_bookings");
    expect(sql).toContain("if not public.is_super_admin() then");
    expect(sql).toContain("and b.starts_at > now()");
    expect(sql).toContain("status in ('pending', 'confirmed')");
    expect(sql).toContain("update public.booking_recurrence_series");
  });
});

describe("initial attendee creation actions", () => {
  it("passes optional attendees atomically and queues existing attendee notifications", () => {
    expect(employeeActions).toContain('rpc("create_booking_with_participants"');
    expect(employeeActions).toContain("p_invited_user_ids: inviteduserids.data");
    expect(employeeActions).toContain("queueinitialinvitationnotifications");
    expect(adminActions).toContain('rpc("admin_create_booking_with_participants"');
    expect(adminActions).toContain("p_invited_user_ids: inviteduserids.data");
    expect(adminActions).toContain("queueinitialinvitationnotifications");
  });

  it("notifies only departments newly tagged after a confirmed booking edit", () => {
    expect(employeeActions).toContain("departmentids: newdepartmentids");
    expect(departmentNotifications).toContain('query = query.in("department_id", departmentIds)');
  });

  it("removes the employee recurring management controls", () => {
    expect(bookingDetail).not.toContain("RecurringCancelActions");
    expect(settingsForm).not.toContain("recurringBookingsEnabled");
    expect(
      existsSync(join(process.cwd(), "app/(app)/bookings/recurring/new/page.tsx")),
    ).toBe(false);
  });
});
