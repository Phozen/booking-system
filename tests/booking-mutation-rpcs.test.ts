import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getFriendlyBookingError } from "@/lib/bookings/errors";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0022_booking_mutation_rpcs.sql"),
  "utf8",
);
const hardeningMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/0023_harden_employee_cancellation_updates.sql"),
  "utf8",
);

function compactSql(value: string) {
  return value.replace(/\s+/g, " ").toLowerCase();
}

const sql = compactSql(migration);
const statements = migration
  .split(";")
  .map((statement) => compactSql(statement))
  .filter(Boolean);

describe("booking mutation RPC migration contract", () => {
  it("keeps direct employee table updates cancellation-only while adding a transaction-local trusted bypass", () => {
    expect(sql).toContain(
      "current_setting('booking_system.allow_booking_mutation', true) = 'on'",
    );
    expect(sql).toContain(
      "set_config('booking_system.allow_booking_mutation', 'on', true)",
    );
    expect(sql).toContain(
      "set_config('booking_system.allow_booking_mutation', 'off', true)",
    );
    expect(sql).toContain("users can only cancel their own active bookings");
    expect(sql).toContain("new.status <> 'cancelled'");
  });

  it("defines owner edit RPC with authenticated ownership and status checks", () => {
    expect(sql).toContain("create or replace function public.update_own_booking");
    expect(sql).toContain("if not public.is_active_user()");
    expect(sql).toContain("if v_booking.user_id <> auth.uid()");
    expect(sql).toContain("if v_booking.status not in ('pending', 'confirmed')");
    expect(sql).toContain("grant execute on function public.update_own_booking");
    expect(sql).toContain("to authenticated");
  });

  it("defines admin create RPC as service-role only with database admin actor validation", () => {
    expect(sql).toContain("create or replace function public.admin_create_booking");
    expect(sql).toContain("role::text in ('admin', 'super_admin')");
    expect(sql).toContain("and status = 'active'");
    expect(sql).toContain("grant execute on function public.admin_create_booking");
    expect(sql).toContain("to service_role");
    expect(
      statements.some(
        (statement) =>
          statement.includes("grant execute on function public.admin_create_booking") &&
          statement.includes("to authenticated"),
      ),
    ).toBe(false);
  });


  it("validates conflict-adjacent booking invariants in the shared mutation validator", () => {
    expect(sql).toContain("create or replace function public.validate_booking_mutation_input");
    expect(sql).toContain("booking start and end time are required");
    expect(sql).toContain("booking start time must be before end time");
    expect(sql).toContain("booking user is not active");
    expect(sql).toContain("facility is not available for booking");
    expect(sql).toContain("attendee count exceeds facility capacity");
    expect(sql).toContain("facility is blocked for the selected time");
    expect(sql).toContain("facility is under maintenance for the selected time");
  });
});
describe("employee cancellation trigger hardening migration", () => {
  const hardeningSql = compactSql(hardeningMigration);

  it("preserves the transaction-local trusted RPC bypass", () => {
    expect(hardeningSql).toContain(
      "current_setting('booking_system.allow_booking_mutation', true) = 'on'",
    );
  });

  it("blocks direct employee cancellation mutations of newer booking fields", () => {
    for (const column of [
      "catering_required",
      "catering_type",
      "catering_pax",
      "catering_serving_time",
      "catering_dietary_notes",
      "catering_notes",
      "usage_status",
      "checked_in_at",
      "checked_in_by",
      "no_show_marked_at",
      "no_show_marked_by",
      "recurrence_series_id",
      "recurrence_sequence",
    ]) {
      expect(hardeningSql).toContain(`new.${column} is distinct from old.${column}`);
    }
  });
});

describe("booking mutation friendly errors", () => {
  it("maps owner edit status and ownership failures without mislabeling them inactive-account errors", () => {
    expect(
      getFriendlyBookingError({
        code: "P0001",
        message: "Users can only cancel their own active bookings.",
      }),
    ).toBe("This booking can no longer be changed.");

    expect(
      getFriendlyBookingError({
        code: "P0001",
        message: "Users can only update their own bookings.",
      }),
    ).toBe("You do not have permission to change this booking.");
  });

  it("maps RPC validation errors to clear booking-edit messages", () => {
    expect(
      getFriendlyBookingError({
        code: "23P01",
        message: "conflicting key value violates exclusion constraint",
      }),
    ).toBe("This time slot is no longer available. Please choose another time.");

    expect(
      getFriendlyBookingError({
        code: "P0001",
        message: "Facility is blocked for the selected time.",
      }),
    ).toBe(
      "This facility is unavailable during the selected time due to a blocked period.",
    );

    expect(
      getFriendlyBookingError({
        code: "P0001",
        message: "Facility is under maintenance for the selected time.",
      }),
    ).toBe("This facility is under maintenance during the selected time.");

    expect(
      getFriendlyBookingError({
        code: "P0001",
        message: "Attendee count exceeds facility capacity.",
      }),
    ).toBe("Attendee count exceeds the facility capacity.");
  });
});
