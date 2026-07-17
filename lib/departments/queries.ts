import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type Department = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

export async function getActiveDepartments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("departments")
    .select("id,name,email,is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error("Unable to load departments.");
  }

  return ((data ?? []) as {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  }[]).map((department) => ({
    id: department.id,
    name: department.name,
    email: department.email,
    isActive: department.is_active,
  }));
}
