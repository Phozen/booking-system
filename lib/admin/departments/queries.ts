import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DepartmentFilters } from "@/lib/admin/departments/validation";

type DepartmentRecord = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  updated_at: string;
};

export type AdminDepartment = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  updatedAt: string;
};

const departmentSelect = "id,name,email,is_active,updated_at";

function mapDepartment(department: DepartmentRecord): AdminDepartment {
  return {
    id: department.id,
    name: department.name,
    email: department.email,
    isActive: department.is_active,
    updatedAt: department.updated_at,
  };
}

async function loadDepartments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("departments")
    .select(departmentSelect)
    .order("name");

  if (error) throw new Error("Unable to load departments.");
  return ((data ?? []) as DepartmentRecord[]).map(mapDepartment);
}

export async function getAdminDepartments(
  supabase: SupabaseClient,
  filters: DepartmentFilters = {},
) {
  const departments = await loadDepartments(supabase);
  const search = filters.search?.toLowerCase();

  return departments.filter((department) => {
    if (filters.status === "active" && !department.isActive) return false;
    if (filters.status === "inactive" && department.isActive) return false;
    if (!search) return true;
    return [department.name, department.email].some((value) =>
      value.toLowerCase().includes(search),
    );
  });
}

export async function getAdminDepartmentById(
  supabase: SupabaseClient,
  departmentId: string,
) {
  const { data, error } = await supabase
    .from("departments")
    .select(departmentSelect)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error("Unable to load department.");
  return data ? mapDepartment(data as DepartmentRecord) : null;
}
