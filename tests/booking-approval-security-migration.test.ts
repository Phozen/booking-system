import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0032_booking_approval_security.sql",
  ),
  "utf8",
);
const adminActions = readFileSync(
  join(process.cwd(), "lib/admin/bookings/actions.ts"),
  "utf8",
);
const cateringActions = readFileSync(
  join(process.cwd(), "lib/bookings/catering/actions.ts"),
  "utf8",
);
const databaseTest = readFileSync(
  join(
    process.cwd(),
    "supabase/tests/0032_booking_approval_security_test.sql",
  ),
  "utf8",
);

const sql = migration.replace(/\s+/g, " ").toLowerCase();

describe("booking approval security migration", () => {
  it("derives effective approval from system policy with safe defaults", () => {
    expect(sql).toContain(
      "create or replace function public.get_effective_booking_approval_required",
    );
    expect(sql).toContain("where ss.key = 'default_approval_required'");
    expect(sql).toContain("v_default_required := coalesce(v_default_required, false)");
    expect(sql).toContain("'facility_approval_override_enabled'");
    expect(sql).toContain("'allow_facility_approval_override'");
    expect(sql).toContain(
      "v_allow_facility_override := coalesce(v_allow_facility_override, true)",
    );
  });

  it("uses a facility override only when overrides are enabled and the value is explicit", () => {
    expect(sql).toContain(
      "if v_allow_facility_override and v_facility_required is not null then return v_facility_required",
    );
    expect(sql).toContain("return v_default_required");
  });

  it("keeps the policy helper private to database-owned functions", () => {
    expect(sql).toContain(
      "revoke all on function public.get_effective_booking_approval_required(uuid) from public, anon, authenticated, service_role",
    );
  });

  it("rejects caller approval flags and initial statuses that contradict policy", () => {
    expect(sql).toContain(
      "create or replace function public.enforce_booking_approval_on_insert",
    );
    expect(sql).toContain(
      "v_required := public.get_effective_booking_approval_required(new.facility_id)",
    );
    expect(sql).toContain(
      "if new.approval_required is distinct from v_required then raise exception",
    );
    expect(sql).toContain(
      "if new.status is distinct from v_expected_status then raise exception",
    );
    expect(sql).toContain(
      "create trigger enforce_booking_approval_on_insert before insert on public.bookings",
    );
  });

  it("reviews exactly one pending approval atomically as an authenticated admin", () => {
    expect(sql).toContain(
      "create or replace function public.review_booking_approval",
    );
    expect(sql).toContain("if not public.is_admin() then raise exception");
    expect(sql).toContain("for update");
    expect(sql).toContain("if v_pending_approval_count <> 1 then raise exception");
    expect(sql).toContain("perform public.validate_booking_mutation_input");
    expect(sql).toContain("booking conflicts with another active booking");
    expect(sql).toContain("update public.booking_approvals set status = p_decision");
    expect(sql).toContain("update public.bookings set status = case");
    expect(sql).toContain("to authenticated");
  });

  it("removes authenticated direct creation and approval mutation policies", () => {
    expect(sql).toContain(
      "revoke insert, delete on table public.bookings from authenticated",
    );
    expect(sql).toContain(
      "revoke insert, update, delete on table public.booking_approvals from authenticated",
    );
    expect(sql).toContain(
      'drop policy if exists "admins can manage all bookings" on public.bookings',
    );
    expect(sql).toContain(
      'drop policy if exists "admins can manage booking approvals" on public.booking_approvals',
    );
  });

  it("blocks approval-record and non-owner booking updates outside guarded RPCs", () => {
    expect(sql).toContain(
      "booking approvals must be reviewed through the guarded rpc",
    );
    expect(sql).toContain(
      "booking updates must use an authorized mutation rpc",
    );
    expect(sql).toContain("if auth.uid() = old.user_id then");
    expect(sql).not.toContain(
      "if auth.uid() = old.user_id and not public.is_admin() then",
    );
    expect(sql).toContain("new.cancelled_by is distinct from auth.uid()");
    expect(sql).toContain("new.cancelled_at is null");
    expect(sql).toContain("booking cancellation metadata is invalid");
  });

  it("preserves legitimate catering, admin cancellation, and usage workflows through narrow RPCs", () => {
    for (const rpc of [
      "update_booking_catering",
      "cancel_booking_as_admin",
      "update_booking_usage_as_admin",
    ]) {
      expect(sql).toContain(`create or replace function public.${rpc}`);
      expect(sql).toContain(`grant execute on function public.${rpc}`);
    }

    expect(sql).toContain("if not public.is_active_user() then raise exception");
    expect(sql).toContain("if not public.is_admin() then raise exception");
    expect(sql).toContain("for update");
    expect(sql).toContain(
      "usage can only be tracked for confirmed or historical bookings",
    );
  });

  it("cancels owner single and recurring bookings atomically with pending approvals", () => {
    for (const rpc of ["cancel_own_booking", "cancel_own_recurring_bookings"]) {
      expect(sql).toContain(`create or replace function public.${rpc}`);
      expect(sql).toContain(`grant execute on function public.${rpc}`);
    }

    expect(sql).toContain(
      "pending booking must have exactly one pending approval",
    );
    expect(sql).toContain(
      "each pending booking must have exactly one pending approval",
    );
    expect(sql).toContain("update public.booking_approvals ba");
    expect(sql).toContain(
      "revoke update on table public.bookings from authenticated",
    );
    expect(sql).toContain(
      "revoke insert, update, delete on table public.booking_recurrence_series from authenticated",
    );
  });

  it("rejects disabled or malformed recurring series at the database boundary", () => {
    expect(sql).toContain(
      "create or replace function public.enforce_recurring_series_insert",
    );
    expect(sql).toContain("where ss.key = 'recurring_bookings_enabled'");
    expect(sql).toContain("recurring bookings are disabled");
    expect(sql).toContain(
      "users can create recurring series only for themselves",
    );
    expect(sql).toContain(
      "create constraint trigger validate_recurring_series_integrity",
    );
    expect(sql).toContain("deferrable initially deferred");
    expect(sql).toContain("v_count <> new.occurrence_count");
    expect(sql).toContain("v_min_sequence <> 1");
    expect(sql).toContain("v_max_sequence <> v_count");
  });
});

describe("booking approval server-action boundary", () => {
  const actions = adminActions.replace(/\s+/g, " ").toLowerCase();

  it("uses the authenticated atomic review RPC for both decisions", () => {
    expect(actions.match(/rpc\("review_booking_approval"/g)).toHaveLength(2);
    expect(actions).toContain('p_decision: "approved"');
    expect(actions).toContain('p_decision: "rejected"');
  });

  it("does not perform split booking and approval status updates", () => {
    expect(actions).not.toContain('.update({ status: "confirmed" })');
    expect(actions).not.toContain('.update({ status: "rejected" })');
    expect(actions).not.toContain('.from("booking_approvals") .update(');
  });

  it("routes admin cancellation and usage through guarded RPCs", () => {
    expect(actions).toContain('rpc("cancel_booking_as_admin"');
    expect(actions).toContain('rpc( "update_booking_usage_as_admin"');
    expect(actions).not.toContain('.update({ status: "cancelled"');
  });

  it("routes catering changes through its ownership-checking RPC", () => {
    const source = cateringActions.replace(/\s+/g, " ").toLowerCase();

    expect(source).toContain('rpc( "update_booking_catering"');
    expect(source).not.toContain('.from("bookings") .update(');
  });
});

describe("booking approval database-native verification", () => {
  const source = databaseTest.replace(/\s+/g, " ").toLowerCase();

  it("runs transactionally with Azure tenant and exact allowlist fixtures", () => {
    expect(source).toContain("begin;");
    expect(source).toContain("select plan(14)");
    expect(source).toContain("insert into public.approved_users");
    expect(source).toContain("insert into public.microsoft_access_config");
    expect(source).toContain("insert into auth.users");
    expect(source).toContain("insert into auth.identities");
    expect(source).toContain("'azure'");
    expect(source.trim()).toMatch(/rollback;$/);
  });

  it("covers malicious approval input, direct DML, review, and cancellation consistency", () => {
    expect(source).toContain("malicious false approval input is rejected");
    expect(source).toContain("authenticated direct booking insert is denied");
    expect(source).toContain("authenticated direct booking update is denied");
    expect(source).toContain("authenticated direct approval update is denied");
    expect(source).toContain("employee cannot call guarded review rpc");
    expect(source).toContain("nonpending review transition is rejected");
    expect(source).toContain("cancelled booking has no pending approval rows");
  });
});
