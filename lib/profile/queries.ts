import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRole = "employee" | "admin";
export type ProfileStatus = "active" | "disabled" | "pending";

type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: ProfileRole;
  status: ProfileStatus;
  department: string | null;
  phone: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: ProfileRole;
  status: ProfileStatus;
  department: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const profileSelect = `
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

export function mapUserProfile(record: ProfileRecord): UserProfile {
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

export async function getOwnProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load your profile.");
  }

  return data ? mapUserProfile(data as unknown as ProfileRecord) : null;
}

