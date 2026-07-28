import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cache } from "react";

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

export function getSafeInternalPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "https://qbook.invalid");
    const decodedPath = decodeURIComponent(url.pathname);

    if (
      url.origin !== "https://qbook.invalid" ||
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\")
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export const getCurrentAuthState = cache(async function getCurrentAuthState(): Promise<AuthState> {
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

  const profile = await getProfileSession(supabase, user);

  return {
    isConfigured: true,
    user,
    profile,
  };
});

export async function getPostLoginPath(
  supabase: SupabaseClient,
  user: User,
) {
  const profile = await getProfileSession(supabase, user);

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return "/login?error=disabled";
  }

  return getDashboardPathForRole(profile.role);
}
