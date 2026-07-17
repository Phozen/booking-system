import type { SupabaseClient } from "@supabase/supabase-js";

import { isMicrosoftAuthUser, normalizeAccessEmail } from "@/lib/auth/access";

export type AppRole = "employee" | "admin" | "super_admin";

export type ProfileSession = {
  approvedUserId: string | null;
  role: AppRole;
  status: "active" | "disabled" | "pending";
  full_name: string | null;
  department: string | null;
  phone: string | null;
};

export function getDashboardPathForRole(role: AppRole) {
  return isAdminRole(role) ? "/admin/dashboard" : "/dashboard";
}

export function isAdminRole(role: string | null | undefined): role is "admin" | "super_admin" {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined): role is "super_admin" {
  return role === "super_admin";
}

export function formatAppRole(role: string | null | undefined) {
  const labels: Record<AppRole, string> = {
    employee: "Employee",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return labels[role as AppRole] ?? "Employee";
}

export async function getProfileSession(
  supabase: SupabaseClient,
  user: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown>;
  },
): Promise<ProfileSession | null> {
  const normalizedEmail = normalizeAccessEmail(user.email);
  if (!normalizedEmail || !isMicrosoftAuthUser(user)) {
    return null;
  }

  const { data: hasAccess, error: accessError } = await supabase.rpc(
    "has_active_approved_access",
    { p_user_id: user.id },
  );

  if (accessError || hasAccess !== true) {
    return null;
  }

  const { data: approvedUser, error: approvedUserError } = await supabase
    .from("approved_users")
    .select("id,role,status")
    .eq("normalized_email", normalizedEmail)
    .maybeSingle();

  if (
    approvedUserError ||
    (approvedUser !== null && approvedUser.status !== "active")
  ) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role,status,full_name,department,phone")
    .eq("id", user.id)
    .maybeSingle();

  // The app may build or run before Supabase migrations are applied locally,
  // so profile lookup stays defensive around missing-table or RLS errors.
  if (error || !data) {
    return null;
  }

  const role =
    approvedUser && isAdminRole(approvedUser.role)
      ? approvedUser.role
      : "employee";

  return {
    approvedUserId: approvedUser?.id ?? null,
    role,
    status: "active",
    full_name: data.full_name ?? null,
    department: data.department ?? null,
    phone: data.phone ?? null,
  };
}
