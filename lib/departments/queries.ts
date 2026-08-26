import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { DEPARTMENTS_CACHE_TAG } from "@/lib/catalog/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type Department = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

type DepartmentRecord = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
};

async function loadActiveDepartments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("departments")
    .select("id,name,email,is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error("Unable to load departments.");
  }

  return ((data ?? []) as DepartmentRecord[]).map((department) => ({
    id: department.id,
    name: department.name,
    email: department.email,
    isActive: department.is_active,
  }));
}

const getCachedActiveDepartments = unstable_cache(
  async () => loadActiveDepartments(createAdminClient()),
  ["active-departments"],
  { revalidate: 60, tags: [DEPARTMENTS_CACHE_TAG] },
);

export const getActiveDepartments = cache(async function getActiveDepartments(
  supabase?: SupabaseClient,
) {
  try {
    return await getCachedActiveDepartments();
  } catch (error) {
    if (!supabase) {
      throw error;
    }

    return loadActiveDepartments(supabase);
  }
});
