import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "employee" | "admin";

export type ProfileSession = {
  role: AppRole;
  status: "active" | "disabled" | "pending";
};

export function getDashboardPathForRole(role: AppRole) {
  return role === "admin" ? "/admin/dashboard" : "/dashboard";
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

  const role = data.role === "admin" ? "admin" : "employee";
  const status =
    data.status === "disabled" || data.status === "pending"
      ? data.status
      : "active";

  return { role, status };
}
