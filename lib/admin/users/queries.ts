import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserFilters, UserRole, UserStatus } from "@/lib/admin/users/validation";

type UserProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  phone: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const userProfileSelect = `
  id,
  email,
  full_name,
  role,
  status,
  department,
  phone,
  last_login_at,
  created_at,
  updated_at
`;

function mapUserProfile(record: UserProfileRecord): AdminUserProfile {
  return {
    id: record.id,
    email: record.email,
    fullName: record.full_name,
    role: record.role,
    status: record.status,
    department: record.department,
    phone: record.phone,
    lastLoginAt: record.last_login_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function getAdminUsers(
  supabase: SupabaseClient,
  filters: UserFilters = {},
) {
  let query = supabase
    .from("profiles")
    .select(userProfileSelect)
    .order("created_at", { ascending: false });

  if (filters.search) {
    const search = filters.search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,department.ilike.%${search}%`,
    );
  }

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load users.");
  }

  return ((data as unknown as UserProfileRecord[] | null) ?? []).map(
    mapUserProfile,
  );
}

export async function getAdminUserById(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(userProfileSelect)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load user profile.");
  }

  return data ? mapUserProfile(data as unknown as UserProfileRecord) : null;
}

export async function countOtherActiveSuperAdmins(
  supabase: SupabaseClient,
  targetUserId: string,
) {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("status", "active")
    .neq("id", targetUserId);

  if (error) {
    throw new Error("Unable to verify active super admin coverage.");
  }

  return count ?? 0;
}
