import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  getDashboardPathForRole,
  isAdminRole,
  isSuperAdminRole,
} from "@/lib/auth/profile";
import {
  REQUEST_NEXT_HEADER,
  buildLoginRequiredPath,
} from "@/lib/auth/protected-paths";
import { getCurrentAuthState, type AuthState } from "@/lib/auth/session";

type ActiveAuthState = AuthState & {
  user: NonNullable<AuthState["user"]>;
  profile: NonNullable<AuthState["profile"]>;
};

export async function requireUser(): Promise<ActiveAuthState> {
  const authState = await getCurrentAuthState();

  if (!authState.user) {
    const headerStore = await headers();
    redirect(buildLoginRequiredPath(headerStore.get(REQUEST_NEXT_HEADER)));
  }

  if (!authState.profile || authState.profile.status !== "active") {
    redirect("/login?error=disabled");
  }

  return {
    ...authState,
    user: authState.user,
    profile: authState.profile,
  };
}

export async function requireAdmin() {
  const authState = await requireUser();
  const role = authState.profile?.role ?? "employee";

  if (!isAdminRole(role)) {
    redirect(getDashboardPathForRole(role));
  }

  return authState;
}

export async function requireSuperAdmin() {
  const authState = await requireUser();
  const role = authState.profile?.role ?? "employee";

  if (!isSuperAdminRole(role)) {
    redirect(getDashboardPathForRole(role));
  }

  return authState;
}
