import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "employee" | "admin" | "super_admin";

export type ProfileSession = {
  role: AppRole;
  status: "active" | "disabled" | "pending";
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
  userId: string,
): Promise<ProfileSession | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", userId)
    .maybeSingle();

  // The app may build or run before Supabase migrations are applied locally,
  // so profile lookup stays defensive around missing-table or RLS errors.
  if (error || !data) {
    return null;
  }

  const role = isAdminRole(data.role) ? data.role : "employee";
  const status =
    data.status === "disabled" || data.status === "pending"
      ? data.status
      : "active";

  return { role, status };
}
