import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type TestUser = {
  id: string;
  email: string;
};

type Facility = {
  id: string;
  capacity: number;
};

type TestRole = "employee" | "admin" | "super_admin";

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env.local");
  let text = "";

  try {
    text = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    process.env[key] ??= value;
  }
}

function compactError(error: { code?: string; message?: string } | null) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? null,
  };
}

// Retired after migration 0031: this legacy harness creates password identities,
// which correctly cannot satisfy Qbook's Azure tenant assertion. Database-native
// coverage for the current access model lives in supabase/tests/.
const describeSupabase = describe.skip;

describeSupabase("booking mutation RPC Supabase integration", () => {
  loadEnvFile();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const marker = `mutation_rpc_${Date.now()}`;
  const password = `MutationRpc!${Date.now()}`;
  const userIds: string[] = [];
  const bookingIds: string[] = [];
  const recurrenceSeriesIds: string[] = [];
  const blockedPeriodIds: string[] = [];
  const maintenanceIds: string[] = [];

  let admin: SupabaseClient;
  let employeeClient: SupabaseClient;
  let otherClient: SupabaseClient;
  let adminEmployeeClient: SupabaseClient;
  let employee: TestUser;
  let otherEmployee: TestUser;
  let disabledEmployee: TestUser;
  let adminActor: TestUser;
  let superAdminActor: TestUser;
  let facility: Facility;

  async function createUser(
    email: string,
    {
      role = "employee",
      status = "active",
    }: { role?: TestRole; status?: "active" | "disabled" } = {},
  ): Promise<TestUser> {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: marker },
    });

    if (error || !data.user) {
      throw new Error(`Unable to create test user: ${error?.message}`);
    }

    userIds.push(data.user.id);

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: marker,
        department: "QA",
        phone: "000",
        role,
        status,
      })
      .eq("id", data.user.id);

    if (profileError) {
      throw new Error(`Unable to activate test profile: ${profileError.message}`);
    }

    return { id: data.user.id, email };
  }

  async function signIn(email: string) {
    const client = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: true },
    });
    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(`Unable to sign in test user: ${error.message}`);
    }

    return client;
  }

  function bookingArgs({
    userId = employee.id,
    title,
    startsAt,
    endsAt,
    approvalRequired = false,
    attendeeCount = 1,
  }: {
    userId?: string;
    title: string;
    startsAt: string;
    endsAt: string;
    approvalRequired?: boolean;
    attendeeCount?: number;
  }) {
    return {
      p_facility_id: facility.id,
      p_user_id: userId,
      p_created_by: userId,
      p_title: title,
      p_description: marker,
      p_attendee_count: attendeeCount,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_approval_required: approvalRequired,
      p_catering_required: false,
      p_catering_type: null,
      p_catering_pax: null,
      p_catering_serving_time: null,
      p_catering_dietary_notes: null,
      p_catering_notes: null,
    };
  }

  async function createEmployeeBooking(input: Parameters<typeof bookingArgs>[0]) {
    const { data, error } = await employeeClient.rpc("create_booking", bookingArgs(input));

    if (error || !data) {
      throw new Error(`Unable to create test booking: ${error?.message}`);
    }

    bookingIds.push(data.id);
    return data as { id: string; status: string };
  }

  async function createTrackedSeries(title: string) {
    const { data, error } = await admin
      .from("booking_recurrence_series")
      .insert({
        owner_user_id: employee.id,
        facility_id: facility.id,
        title,
        description: marker,
        frequency: "weekly",
        interval_count: 1,
        starts_on: "2040-01-01",
        occurrence_count: 1,
        created_by: employee.id,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Unable to create test recurrence series: ${error?.message}`);
    }

    recurrenceSeriesIds.push(data.id);
    return data as { id: string };
  }

  function adminBookingArgs({
    actorUserId = adminActor.id,
    targetUserId = employee.id,
    title,
    startsAt,
    endsAt,
    approvalRequired = false,
    attendeeCount = 1,
  }: {
    actorUserId?: string;
    targetUserId?: string;
    title: string;
    startsAt: string;
    endsAt: string;
    approvalRequired?: boolean;
    attendeeCount?: number;
  }) {
    return {
      p_actor_user_id: actorUserId,
      p_target_user_id: targetUserId,
      p_facility_id: facility.id,
      p_title: title,
      p_description: marker,
      p_attendee_count: attendeeCount,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_approval_required: approvalRequired,
      p_catering_required: false,
      p_catering_type: null,
      p_catering_pax: null,
      p_catering_serving_time: null,
      p_catering_dietary_notes: null,
      p_catering_notes: null,
    };
  }

  async function createAdminBooking(input: Parameters<typeof adminBookingArgs>[0]) {
    const { data, error } = await admin.rpc("admin_create_booking", adminBookingArgs(input));

    if (error || !data) {
      throw new Error(`Unable to create admin test booking: ${error?.message}`);
    }

    bookingIds.push(data.id);
    return data as { id: string; status: string; approval_required: boolean };
  }

  function recurringArgs({
    ownerUserId = employee.id,
    title,
    startsOn = "2039-01-01",
    occurrenceCount,
    occurrences,
    attendeeCount = 1,
  }: {
    ownerUserId?: string;
    title: string;
    startsOn?: string;
    occurrenceCount?: number;
    occurrences: { sequence: number; startsAt: string; endsAt: string }[];
    attendeeCount?: number;
  }) {
    return {
      p_owner_user_id: ownerUserId,
      p_facility_id: facility.id,
      p_title: title,
      p_description: marker,
      p_attendee_count: attendeeCount,
      p_approval_required: false,
      p_frequency: "weekly",
      p_interval_count: 1,
      p_starts_on: startsOn,
      p_ends_on: null,
      p_occurrence_count: occurrenceCount ?? occurrences.length,
      p_occurrences: occurrences,
    };
  }

  async function countRows(table: string, title: string) {
    const { count, error } = await admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("title", title);

    if (error) {
      throw new Error(`Unable to count ${table}: ${error.message}`);
    }

    return count ?? 0;
  }

  async function withApprovalPolicy(
    {
      defaultRequired,
      overrideEnabled,
      facilityRequired,
    }: {
      defaultRequired: boolean;
      overrideEnabled: boolean;
      facilityRequired: boolean | null;
    },
    run: () => Promise<void>,
  ) {
    const settingKeys = [
      "default_approval_required",
      "facility_approval_override_enabled",
    ];
    const { data: previousSettings, error: settingsReadError } = await admin
      .from("system_settings")
      .select("key,value")
      .in("key", settingKeys);
    const { data: previousFacility, error: facilityReadError } = await admin
      .from("facilities")
      .select("requires_approval")
      .eq("id", facility.id)
      .single();

    if (settingsReadError || facilityReadError || !previousFacility) {
      throw new Error("Unable to snapshot booking approval policy.");
    }

    try {
      const { error: defaultError } = await admin
        .from("system_settings")
        .update({ value: defaultRequired })
        .eq("key", "default_approval_required");
      const { error: overrideError } = await admin
        .from("system_settings")
        .update({ value: overrideEnabled })
        .eq("key", "facility_approval_override_enabled");
      const { error: facilityError } = await admin
        .from("facilities")
        .update({ requires_approval: facilityRequired })
        .eq("id", facility.id);

      if (defaultError || overrideError || facilityError) {
        throw new Error("Unable to configure booking approval policy.");
      }

      await run();
    } finally {
      for (const row of previousSettings ?? []) {
        await admin
          .from("system_settings")
          .update({ value: row.value })
          .eq("key", row.key);
      }
      await admin
        .from("facilities")
        .update({ requires_approval: previousFacility.requires_approval })
        .eq("id", facility.id);
    }
  }

  beforeAll(async () => {
    if (!url || !anon || !serviceRole) {
      throw new Error("Supabase env is required when RUN_SUPABASE_MUTATION_TESTS=true.");
    }

    admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: facilityRow, error: facilityError } = await admin
      .from("facilities")
      .select("id,capacity")
      .eq("status", "active")
      .eq("is_archived", false)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (facilityError || !facilityRow) {
      throw new Error(`Active facility is required: ${facilityError?.message}`);
    }

    facility = facilityRow as Facility;
    employee = await createUser(`${marker}_employee@example.com`);
    otherEmployee = await createUser(`${marker}_other@example.com`);
    disabledEmployee = await createUser(`${marker}_disabled@example.com`, {
      status: "disabled",
    });
    adminActor = await createUser(`${marker}_admin@example.com`, { role: "admin" });
    superAdminActor = await createUser(`${marker}_super@example.com`, {
      role: "super_admin",
    });
    employeeClient = await signIn(employee.email);
    otherClient = await signIn(otherEmployee.email);
    adminEmployeeClient = await signIn(adminActor.email);
  });

  afterAll(async () => {
    for (const id of bookingIds) {
      await admin.from("bookings").delete().eq("id", id);
    }
    for (const id of recurrenceSeriesIds) {
      await admin.from("booking_recurrence_series").delete().eq("id", id);
    }
    for (const id of blockedPeriodIds) {
      await admin.from("blocked_periods").delete().eq("id", id);
    }
    for (const id of maintenanceIds) {
      await admin.from("maintenance_closures").delete().eq("id", id);
    }
    for (const id of userIds) {
      await admin.auth.admin.deleteUser(id);
    }
  });

  it("allows an employee to edit their own pending booking", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} pending`,
      startsAt: "2037-01-01T02:00:00.000Z",
      endsAt: "2037-01-01T03:00:00.000Z",
      approvalRequired: true,
    });

    const { data, error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} pending updated`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-01T04:00:00.000Z",
      p_ends_at: "2037-01-01T05:00:00.000Z",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data?.title).toBe(`${marker} pending updated`);
  });

  it("allows an employee to edit their own confirmed booking", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} confirmed`,
      startsAt: "2037-01-02T02:00:00.000Z",
      endsAt: "2037-01-02T03:00:00.000Z",
    });

    const { data, error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} confirmed updated`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-02T04:00:00.000Z",
      p_ends_at: "2037-01-02T05:00:00.000Z",
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data?.title).toBe(`${marker} confirmed updated`);
  });

  it("rejects editing another user's booking", async () => {
    const { data: booking, error: createError } = await otherClient.rpc(
      "create_booking",
      bookingArgs({
        userId: otherEmployee.id,
        title: `${marker} other`,
        startsAt: "2037-01-03T02:00:00.000Z",
        endsAt: "2037-01-03T03:00:00.000Z",
      }),
    );

    expect(createError).toBeNull();
    bookingIds.push(booking.id);

    const { error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} forbidden`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-03T04:00:00.000Z",
      p_ends_at: "2037-01-03T05:00:00.000Z",
    });

    expect(error?.message).toContain("Users can only update their own bookings");
  });

  it("rejects editing a booking after owner cancellation", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} cancelled edit rejection`,
      startsAt: "2037-01-04T02:00:00.000Z",
      endsAt: "2037-01-04T03:00:00.000Z",
    });

    const { error: cancelError } = await employeeClient.rpc(
      "cancel_own_booking",
      { p_booking_id: booking.id, p_reason: "test cancellation" },
    );
    expect(cancelError).toBeNull();

    const { error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} cancelled updated`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-07T02:00:00.000Z",
      p_ends_at: "2037-01-07T03:00:00.000Z",
    });

    expect(error?.message).toContain("This booking can no longer be edited");
  });

  it("rejects editing into a conflicting slot", async () => {
    await createEmployeeBooking({
      title: `${marker} conflict holder`,
      startsAt: "2037-01-08T02:00:00.000Z",
      endsAt: "2037-01-08T03:00:00.000Z",
    });
    const booking = await createEmployeeBooking({
      title: `${marker} conflict mover`,
      startsAt: "2037-01-08T04:00:00.000Z",
      endsAt: "2037-01-08T05:00:00.000Z",
    });

    const { error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} conflict mover`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-08T02:30:00.000Z",
      p_ends_at: "2037-01-08T03:30:00.000Z",
    });

    expect(error?.code).toBe("23P01");
  });

  it("rejects editing into a blocked period", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} blocked`,
      startsAt: "2037-01-09T02:00:00.000Z",
      endsAt: "2037-01-09T03:00:00.000Z",
    });
    const { data: block, error: blockError } = await admin
      .from("blocked_periods")
      .insert({
        title: `${marker} block`,
        scope: "all_facilities",
        starts_at: "2037-01-09T04:00:00.000Z",
        ends_at: "2037-01-09T05:00:00.000Z",
        is_active: true,
      })
      .select("id")
      .single();

    if (blockError || !block) {
      throw new Error(`Unable to create blocked period: ${blockError?.message}`);
    }

    blockedPeriodIds.push(block.id);

    const { error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} blocked updated`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-09T04:15:00.000Z",
      p_ends_at: "2037-01-09T04:45:00.000Z",
    });

    expect(error?.message).toContain("Facility is blocked");
  });

  it("rejects editing into a maintenance closure", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} maintenance`,
      startsAt: "2037-01-10T02:00:00.000Z",
      endsAt: "2037-01-10T03:00:00.000Z",
    });
    const { data: maintenance, error: maintenanceError } = await admin
      .from("maintenance_closures")
      .insert({
        facility_id: facility.id,
        title: `${marker} maintenance`,
        status: "scheduled",
        starts_at: "2037-01-10T04:00:00.000Z",
        ends_at: "2037-01-10T05:00:00.000Z",
      })
      .select("id")
      .single();

    if (maintenanceError || !maintenance) {
      throw new Error(
        `Unable to create maintenance closure: ${maintenanceError?.message}`,
      );
    }

    maintenanceIds.push(maintenance.id);

    const { error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} maintenance updated`,
      p_description: marker,
      p_attendee_count: 1,
      p_starts_at: "2037-01-10T04:15:00.000Z",
      p_ends_at: "2037-01-10T04:45:00.000Z",
    });

    expect(error?.message).toContain("Facility is under maintenance");
  });

  it("rejects editing over capacity", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} capacity`,
      startsAt: "2037-01-11T02:00:00.000Z",
      endsAt: "2037-01-11T03:00:00.000Z",
    });

    const { error } = await employeeClient.rpc("update_own_booking", {
      p_booking_id: booking.id,
      p_facility_id: facility.id,
      p_title: `${marker} capacity updated`,
      p_description: marker,
      p_attendee_count: facility.capacity + 1,
      p_starts_at: "2037-01-11T04:00:00.000Z",
      p_ends_at: "2037-01-11T05:00:00.000Z",
    });

    expect(error?.message).toContain("Attendee count exceeds facility capacity");
  });

  it("still rejects direct employee non-cancellation table updates", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} direct update`,
      startsAt: "2037-01-12T02:00:00.000Z",
      endsAt: "2037-01-12T03:00:00.000Z",
    });

    const { error } = await employeeClient
      .from("bookings")
      .update({ title: `${marker} direct update forbidden` })
      .eq("id", booking.id);

    expect(error).not.toBeNull();
  });

  it("allows employee cancellation only through the owner RPC", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} cancellation`,
      startsAt: "2037-01-13T02:00:00.000Z",
      endsAt: "2037-01-13T03:00:00.000Z",
    });

    const { data, error } = await employeeClient.rpc("cancel_own_booking", {
      p_booking_id: booking.id,
      p_reason: null,
    });

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data?.status).toBe("cancelled");
  });

  it("rejects direct employee cancellation that mutates catering fields", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} cancellation catering hardening`,
      startsAt: "2037-01-14T02:00:00.000Z",
      endsAt: "2037-01-14T03:00:00.000Z",
    });

    const { error } = await employeeClient
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: employee.id,
        cancelled_at: new Date().toISOString(),
        catering_notes: "mutated during cancellation",
      })
      .eq("id", booking.id);

    expect(error).not.toBeNull();
  });

  it("rejects direct employee cancellation that mutates usage tracking fields", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} cancellation usage hardening`,
      startsAt: "2037-01-15T02:00:00.000Z",
      endsAt: "2037-01-15T03:00:00.000Z",
    });

    const { error } = await employeeClient
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: employee.id,
        cancelled_at: new Date().toISOString(),
        usage_status: "checked_in",
        checked_in_at: new Date().toISOString(),
        checked_in_by: employee.id,
      })
      .eq("id", booking.id);

    expect(error).not.toBeNull();
  });

  it("rejects direct employee cancellation that mutates no-show fields", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} cancellation no-show hardening`,
      startsAt: "2037-01-16T02:00:00.000Z",
      endsAt: "2037-01-16T03:00:00.000Z",
    });

    const { error } = await employeeClient
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: employee.id,
        cancelled_at: new Date().toISOString(),
        usage_status: "no_show",
        no_show_marked_at: new Date().toISOString(),
        no_show_marked_by: employee.id,
      })
      .eq("id", booking.id);

    expect(error).not.toBeNull();
  });

  it("rejects direct employee cancellation that mutates recurrence fields", async () => {
    const booking = await createEmployeeBooking({
      title: `${marker} cancellation recurrence hardening`,
      startsAt: "2037-01-17T02:00:00.000Z",
      endsAt: "2037-01-17T03:00:00.000Z",
    });
    const series = await createTrackedSeries(`${marker} cancellation recurrence`);

    const { error } = await employeeClient
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: employee.id,
        cancelled_at: new Date().toISOString(),
        recurrence_series_id: series.id,
        recurrence_sequence: 1,
      })
      .eq("id", booking.id);

    expect(error).not.toBeNull();
  });

  it("allows an admin actor to create a booking for an active employee", async () => {
    const booking = await createAdminBooking({
      title: `${marker} admin created`,
      startsAt: "2038-01-01T02:00:00.000Z",
      endsAt: "2038-01-01T03:00:00.000Z",
    });

    expect(booking.status).toBe("confirmed");
    expect(booking.approval_required).toBe(false);
  });

  it("allows a super admin actor to create a booking for an active employee", async () => {
    const booking = await createAdminBooking({
      actorUserId: superAdminActor.id,
      title: `${marker} super admin created`,
      startsAt: "2038-01-02T02:00:00.000Z",
      endsAt: "2038-01-02T03:00:00.000Z",
    });

    expect(booking.status).toBe("confirmed");
  });

  it("rejects admin creation for a disabled target user", async () => {
    const { error } = await admin.rpc(
      "admin_create_booking",
      adminBookingArgs({
        targetUserId: disabledEmployee.id,
        title: `${marker} disabled target`,
        startsAt: "2038-01-03T02:00:00.000Z",
        endsAt: "2038-01-03T03:00:00.000Z",
      }),
    );

    expect(error?.message).toContain("Booking user is not active");
  });

  it("rejects admin creation into a conflicting slot", async () => {
    await createAdminBooking({
      title: `${marker} admin conflict holder`,
      startsAt: "2038-01-04T02:00:00.000Z",
      endsAt: "2038-01-04T03:00:00.000Z",
    });

    const { error } = await admin.rpc(
      "admin_create_booking",
      adminBookingArgs({
        title: `${marker} admin conflict rejected`,
        startsAt: "2038-01-04T02:30:00.000Z",
        endsAt: "2038-01-04T03:30:00.000Z",
      }),
    );

    expect(error?.code).toBe("23P01");
  });

  it("rejects admin creation into a blocked period", async () => {
    const { data: block, error: blockError } = await admin
      .from("blocked_periods")
      .insert({
        title: `${marker} admin block`,
        scope: "all_facilities",
        starts_at: "2038-01-05T02:00:00.000Z",
        ends_at: "2038-01-05T03:00:00.000Z",
        is_active: true,
      })
      .select("id")
      .single();

    if (blockError || !block) {
      throw new Error(`Unable to create admin blocked period: ${blockError?.message}`);
    }

    blockedPeriodIds.push(block.id);

    const { error } = await admin.rpc(
      "admin_create_booking",
      adminBookingArgs({
        title: `${marker} admin blocked rejected`,
        startsAt: "2038-01-05T02:15:00.000Z",
        endsAt: "2038-01-05T02:45:00.000Z",
      }),
    );

    expect(error?.message).toContain("Facility is blocked");
  });

  it("rejects admin creation into a maintenance closure", async () => {
    const { data: maintenance, error: maintenanceError } = await admin
      .from("maintenance_closures")
      .insert({
        facility_id: facility.id,
        title: `${marker} admin maintenance`,
        status: "scheduled",
        starts_at: "2038-01-06T02:00:00.000Z",
        ends_at: "2038-01-06T03:00:00.000Z",
      })
      .select("id")
      .single();

    if (maintenanceError || !maintenance) {
      throw new Error(
        `Unable to create admin maintenance closure: ${maintenanceError?.message}`,
      );
    }

    maintenanceIds.push(maintenance.id);

    const { error } = await admin.rpc(
      "admin_create_booking",
      adminBookingArgs({
        title: `${marker} admin maintenance rejected`,
        startsAt: "2038-01-06T02:15:00.000Z",
        endsAt: "2038-01-06T02:45:00.000Z",
      }),
    );

    expect(error?.message).toContain("Facility is under maintenance");
  });

  it("rejects admin creation over capacity", async () => {
    const { error } = await admin.rpc(
      "admin_create_booking",
      adminBookingArgs({
        title: `${marker} admin capacity rejected`,
        startsAt: "2038-01-07T02:00:00.000Z",
        endsAt: "2038-01-07T03:00:00.000Z",
        attendeeCount: facility.capacity + 1,
      }),
    );

    expect(error?.message).toContain("Attendee count exceeds facility capacity");
  });

  it("does not allow an employee client to call admin_create_booking", async () => {
    const { error } = await employeeClient.rpc(
      "admin_create_booking",
      adminBookingArgs({
        actorUserId: employee.id,
        targetUserId: otherEmployee.id,
        title: `${marker} employee admin rpc rejected`,
        startsAt: "2038-01-08T02:00:00.000Z",
        endsAt: "2038-01-08T03:00:00.000Z",
      }),
    );

    expect(error).not.toBeNull();
  });

  it("creates exactly one approval row for approval-required admin bookings", async () => {
    const booking = await createAdminBooking({
      title: `${marker} admin approval required`,
      startsAt: "2038-01-09T02:00:00.000Z",
      endsAt: "2038-01-09T03:00:00.000Z",
      approvalRequired: true,
    });

    const { data, error } = await admin
      .from("booking_approvals")
      .select("id,status,requested_by")
      .eq("booking_id", booking.id);

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({
      status: "pending",
      requested_by: employee.id,
    });
  });

  it("does not create an approval row for non-approval admin bookings", async () => {
    const booking = await createAdminBooking({
      title: `${marker} admin no approval`,
      startsAt: "2038-01-10T02:00:00.000Z",
      endsAt: "2038-01-10T03:00:00.000Z",
      approvalRequired: false,
    });

    const { data, error } = await admin
      .from("booking_approvals")
      .select("id")
      .eq("booking_id", booking.id);

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data).toEqual([]);
  });

  it("creates a linked recurring series with unique recurrence sequences", async () => {
    const title = `${marker} recurring linked`;
    const { data, error } = await employeeClient.rpc(
      "create_recurring_booking_series",
      recurringArgs({
        title,
        startsOn: "2039-01-01",
        occurrences: [
          {
            sequence: 1,
            startsAt: "2039-01-01T02:00:00.000Z",
            endsAt: "2039-01-01T03:00:00.000Z",
          },
          {
            sequence: 2,
            startsAt: "2039-01-08T02:00:00.000Z",
            endsAt: "2039-01-08T03:00:00.000Z",
          },
        ],
      }),
    );

    expect(compactError(error)).toEqual({ code: null, message: null });
    expect(data).toHaveLength(2);

    const rows = data as {
      series_id: string;
      booking_id: string;
      recurrence_sequence: number;
    }[];
    const seriesIds = new Set(rows.map((row) => row.series_id));
    expect(seriesIds.size).toBe(1);
    recurrenceSeriesIds.push(rows[0].series_id);
    bookingIds.push(...rows.map((row) => row.booking_id));
    expect(rows.map((row) => row.recurrence_sequence)).toEqual([1, 2]);

    const { data: bookings, error: bookingError } = await admin
      .from("bookings")
      .select("id,recurrence_series_id,recurrence_sequence")
      .in(
        "id",
        rows.map((row) => row.booking_id),
      )
      .order("recurrence_sequence", { ascending: true });

    expect(compactError(bookingError)).toEqual({ code: null, message: null });
    expect(bookings?.map((booking) => booking.recurrence_series_id)).toEqual([
      rows[0].series_id,
      rows[0].series_id,
    ]);
    expect(bookings?.map((booking) => booking.recurrence_sequence)).toEqual([1, 2]);
  });

  it("rolls back the whole recurring series when one occurrence conflicts", async () => {
    await createEmployeeBooking({
      title: `${marker} recurring conflict holder`,
      startsAt: "2039-02-08T02:00:00.000Z",
      endsAt: "2039-02-08T03:00:00.000Z",
    });
    const title = `${marker} recurring conflict rollback`;

    const { error } = await employeeClient.rpc(
      "create_recurring_booking_series",
      recurringArgs({
        title,
        startsOn: "2039-02-01",
        occurrences: [
          {
            sequence: 1,
            startsAt: "2039-02-01T02:00:00.000Z",
            endsAt: "2039-02-01T03:00:00.000Z",
          },
          {
            sequence: 2,
            startsAt: "2039-02-08T02:30:00.000Z",
            endsAt: "2039-02-08T03:30:00.000Z",
          },
        ],
      }),
    );

    expect(error?.code).toBe("23P01");
    expect(await countRows("bookings", title)).toBe(0);
    expect(await countRows("booking_recurrence_series", title)).toBe(0);
  });

  it("rolls back the whole recurring series when one occurrence is blocked", async () => {
    const title = `${marker} recurring blocked rollback`;
    const { data: block, error: blockError } = await admin
      .from("blocked_periods")
      .insert({
        title: `${marker} recurring block`,
        scope: "all_facilities",
        starts_at: "2039-03-08T02:00:00.000Z",
        ends_at: "2039-03-08T03:00:00.000Z",
        is_active: true,
      })
      .select("id")
      .single();

    if (blockError || !block) {
      throw new Error(`Unable to create recurring blocked period: ${blockError?.message}`);
    }

    blockedPeriodIds.push(block.id);

    const { error } = await employeeClient.rpc(
      "create_recurring_booking_series",
      recurringArgs({
        title,
        startsOn: "2039-03-01",
        occurrences: [
          {
            sequence: 1,
            startsAt: "2039-03-01T02:00:00.000Z",
            endsAt: "2039-03-01T03:00:00.000Z",
          },
          {
            sequence: 2,
            startsAt: "2039-03-08T02:15:00.000Z",
            endsAt: "2039-03-08T02:45:00.000Z",
          },
        ],
      }),
    );

    expect(error?.message).toContain("Facility is blocked");
    expect(await countRows("bookings", title)).toBe(0);
    expect(await countRows("booking_recurrence_series", title)).toBe(0);
  });

  it("rolls back the whole recurring series when one occurrence is under maintenance", async () => {
    const title = `${marker} recurring maintenance rollback`;
    const { data: maintenance, error: maintenanceError } = await admin
      .from("maintenance_closures")
      .insert({
        facility_id: facility.id,
        title: `${marker} recurring maintenance`,
        status: "scheduled",
        starts_at: "2039-04-08T02:00:00.000Z",
        ends_at: "2039-04-08T03:00:00.000Z",
      })
      .select("id")
      .single();

    if (maintenanceError || !maintenance) {
      throw new Error(
        `Unable to create recurring maintenance closure: ${maintenanceError?.message}`,
      );
    }

    maintenanceIds.push(maintenance.id);

    const { error } = await employeeClient.rpc(
      "create_recurring_booking_series",
      recurringArgs({
        title,
        startsOn: "2039-04-01",
        occurrences: [
          {
            sequence: 1,
            startsAt: "2039-04-01T02:00:00.000Z",
            endsAt: "2039-04-01T03:00:00.000Z",
          },
          {
            sequence: 2,
            startsAt: "2039-04-08T02:15:00.000Z",
            endsAt: "2039-04-08T02:45:00.000Z",
          },
        ],
      }),
    );

    expect(error?.message).toContain("Facility is under maintenance");
    expect(await countRows("bookings", title)).toBe(0);
    expect(await countRows("booking_recurrence_series", title)).toBe(0);
  });

  it("rejects recurring creation over capacity", async () => {
    const title = `${marker} recurring capacity rejected`;

    const { error } = await employeeClient.rpc(
      "create_recurring_booking_series",
      recurringArgs({
        title,
        startsOn: "2039-05-01",
        attendeeCount: facility.capacity + 1,
        occurrences: [
          {
            sequence: 1,
            startsAt: "2039-05-01T02:00:00.000Z",
            endsAt: "2039-05-01T03:00:00.000Z",
          },
        ],
      }),
    );

    expect(error?.message).toContain("Attendee count exceeds facility capacity");
    expect(await countRows("bookings", title)).toBe(0);
    expect(await countRows("booking_recurrence_series", title)).toBe(0);
  });

  it("does not allow an employee to create a recurring series for another owner", async () => {
    const { error } = await employeeClient.rpc(
      "create_recurring_booking_series",
      recurringArgs({
        ownerUserId: otherEmployee.id,
        title: `${marker} recurring other owner rejected`,
        startsOn: "2039-06-01",
        occurrences: [
          {
            sequence: 1,
            startsAt: "2039-06-01T02:00:00.000Z",
            endsAt: "2039-06-01T03:00:00.000Z",
          },
        ],
      }),
    );

    expect(error?.message).toContain(
      "Users can only create recurring bookings for themselves",
    );
  });

  it("rejects malicious false approval input when database policy requires approval", async () => {
    await withApprovalPolicy(
      {
        defaultRequired: true,
        overrideEnabled: false,
        facilityRequired: false,
      },
      async () => {
        const { error } = await employeeClient.rpc(
          "create_booking",
          bookingArgs({
            title: `${marker} malicious false approval rejected`,
            startsAt: "2041-01-01T02:00:00.000Z",
            endsAt: "2041-01-01T03:00:00.000Z",
            approvalRequired: false,
          }),
        );

        expect(error?.message).toContain(
          "Booking approval requirement does not match the effective database policy",
        );
      },
    );
  });

  it("denies employee and admin direct booking DML", async () => {
    await withApprovalPolicy(
      {
        defaultRequired: false,
        overrideEnabled: false,
        facilityRequired: null,
      },
      async () => {
        const booking = await createEmployeeBooking({
          title: `${marker} direct booking dml target`,
          startsAt: "2041-01-02T02:00:00.000Z",
          endsAt: "2041-01-02T03:00:00.000Z",
        });
        const insertRow = {
          facility_id: facility.id,
          user_id: employee.id,
          created_by: employee.id,
          title: `${marker} direct booking insert denied`,
          attendee_count: 1,
          status: "confirmed",
          starts_at: "2041-01-03T02:00:00.000Z",
          ends_at: "2041-01-03T03:00:00.000Z",
          approval_required: false,
        };

        for (const client of [employeeClient, adminEmployeeClient]) {
          const { error: insertError } = await client
            .from("bookings")
            .insert(insertRow);
          const { error: updateError } = await client
            .from("bookings")
            .update({ title: `${marker} direct update denied` })
            .eq("id", booking.id);

          expect(insertError).not.toBeNull();
          expect(updateError).not.toBeNull();
        }
      },
    );
  });

  it("denies direct approval-row mutation and employee review RPC calls", async () => {
    await withApprovalPolicy(
      {
        defaultRequired: true,
        overrideEnabled: false,
        facilityRequired: null,
      },
      async () => {
        const booking = await createEmployeeBooking({
          title: `${marker} approval mutation target`,
          startsAt: "2041-01-04T02:00:00.000Z",
          endsAt: "2041-01-04T03:00:00.000Z",
          approvalRequired: true,
        });
        const { data: approval } = await admin
          .from("booking_approvals")
          .select("id")
          .eq("booking_id", booking.id)
          .single();

        for (const client of [employeeClient, adminEmployeeClient]) {
          const { error } = await client
            .from("booking_approvals")
            .update({ status: "approved" })
            .eq("id", approval?.id ?? "");
          expect(error).not.toBeNull();
        }

        const { error: employeeReviewError } = await employeeClient.rpc(
          "review_booking_approval",
          {
            p_booking_id: booking.id,
            p_decision: "approved",
            p_remarks: null,
          },
        );
        expect(employeeReviewError?.message).toContain(
          "Only active admins can review booking approvals",
        );
      },
    );
  });

  it("rejects invalid and nonpending approval review transitions", async () => {
    await withApprovalPolicy(
      {
        defaultRequired: false,
        overrideEnabled: false,
        facilityRequired: null,
      },
      async () => {
        const booking = await createEmployeeBooking({
          title: `${marker} nonpending review target`,
          startsAt: "2041-01-05T02:00:00.000Z",
          endsAt: "2041-01-05T03:00:00.000Z",
        });
        const { error: nonpendingError } = await adminEmployeeClient.rpc(
          "review_booking_approval",
          {
            p_booking_id: booking.id,
            p_decision: "approved",
            p_remarks: null,
          },
        );
        const { error: invalidError } = await adminEmployeeClient.rpc(
          "review_booking_approval",
          {
            p_booking_id: booking.id,
            p_decision: "pending",
            p_remarks: null,
          },
        );

        expect(nonpendingError?.message).toContain(
          "Only pending approval-required bookings can be reviewed",
        );
        expect(invalidError?.message).toContain(
          "Approval decision must be approved or rejected",
        );
      },
    );
  });

  it("owner cancellation closes the pending approval atomically", async () => {
    await withApprovalPolicy(
      {
        defaultRequired: true,
        overrideEnabled: false,
        facilityRequired: null,
      },
      async () => {
        const booking = await createEmployeeBooking({
          title: `${marker} owner cancellation approval close`,
          startsAt: "2041-01-06T02:00:00.000Z",
          endsAt: "2041-01-06T03:00:00.000Z",
          approvalRequired: true,
        });
        const { error: cancellationError } = await employeeClient.rpc(
          "cancel_own_booking",
          { p_booking_id: booking.id, p_reason: "No longer needed" },
        );
        const { count, error: countError } = await admin
          .from("booking_approvals")
          .select("id", { count: "exact", head: true })
          .eq("booking_id", booking.id)
          .eq("status", "pending");

        expect(cancellationError).toBeNull();
        expect(countError).toBeNull();
        expect(count).toBe(0);
      },
    );
  });
});
