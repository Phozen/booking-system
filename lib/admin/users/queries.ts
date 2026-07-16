import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeAccessEmail } from "@/lib/auth/access";
import type { UserFilters, UserRole, UserStatus } from "@/lib/admin/users/validation";

type ApprovedUserRecord = {
  id: string;
  email: string;
  normalized_email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

type UserProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  phone: string | null;
  last_login_at: string | null;
};

export type AdminUserProfile = {
  id: string;
  authUserId: string | null;
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

const approvedUserSelect = `
  id,
  email,
  normalized_email,
  role,
  status,
  created_at,
  updated_at
`;

const userProfileSelect = `
  id,
  email,
  full_name,
  department,
  phone,
  last_login_at
`;

function mapApprovedUser(
  approved: ApprovedUserRecord,
  profile: UserProfileRecord | undefined,
): AdminUserProfile {
  return {
    id: approved.id,
    authUserId: profile?.id ?? null,
    email: approved.normalized_email,
    fullName: profile?.full_name ?? null,
    role: approved.role,
    status: approved.status,
    department: profile?.department ?? null,
    phone: profile?.phone ?? null,
    lastLoginAt: profile?.last_login_at ?? null,
    createdAt: approved.created_at,
    updatedAt: approved.updated_at,
  };
}

async function getProfilesByEmail(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("profiles").select(userProfileSelect);

  if (error) {
    throw new Error("Unable to load linked user profiles.");
  }

  return new Map(
    (((data as unknown as UserProfileRecord[] | null) ?? [])).map((profile) => [
      normalizeAccessEmail(profile.email),
      profile,
    ]),
  );
}

export async function getAdminUsers(
  supabase: SupabaseClient,
  filters: UserFilters = {},
) {
  const [{ data, error }, profilesByEmail] = await Promise.all([
    supabase
      .from("approved_users")
      .select(approvedUserSelect)
      .order("created_at", { ascending: false }),
    getProfilesByEmail(supabase),
  ]);

  if (error) {
    throw new Error("Unable to load approved users.");
  }

  const users = ((data as unknown as ApprovedUserRecord[] | null) ?? []).map(
    (approved) =>
      mapApprovedUser(approved, profilesByEmail.get(approved.normalized_email)),
  );

  const search = filters.search?.toLowerCase();
  return users.filter((user) => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.status && user.status !== filters.status) return false;
    if (!search) return true;

    return [user.email, user.fullName, user.department]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search));
  });
}

export async function getAdminUserById(
  supabase: SupabaseClient,
  approvedUserId: string,
) {
  const [{ data, error }, profilesByEmail] = await Promise.all([
    supabase
      .from("approved_users")
      .select(approvedUserSelect)
      .eq("id", approvedUserId)
      .maybeSingle(),
    getProfilesByEmail(supabase),
  ]);

  if (error) {
    throw new Error("Unable to load approved user.");
  }

  if (!data) {
    return null;
  }

  const approved = data as unknown as ApprovedUserRecord;
  return mapApprovedUser(
    approved,
    profilesByEmail.get(approved.normalized_email),
  );
}

export async function countOtherActiveSuperAdmins(
  supabase: SupabaseClient,
  approvedUserId: string,
) {
  const { count, error } = await supabase
    .from("approved_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("status", "active")
    .neq("id", approvedUserId);

  if (error) {
    throw new Error("Unable to verify active super admin coverage.");
  }

  return count ?? 0;
}
