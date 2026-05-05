import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  getDashboardPathForRole,
  getProfileSession,
  type ProfileSession,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  isConfigured: boolean;
  user: User | null;
  profile: ProfileSession | null;
};

export async function getCurrentAuthState(): Promise<AuthState> {
  let supabase: SupabaseClient;

  try {
    supabase = await createClient();
  } catch {
    return {
      isConfigured: false,
      user: null,
      profile: null,
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      isConfigured: true,
      user: null,
      profile: null,
    };
  }

  const profile = await getProfileSession(supabase, user.id);

  return {
    isConfigured: true,
    user,
    profile,
  };
}

export async function getPostLoginPath(
  supabase: SupabaseClient,
  user: User,
) {
  const profile = await getProfileSession(supabase, user.id);

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return "/login?error=disabled";
  }

  return getDashboardPathForRole(profile.role);
}
