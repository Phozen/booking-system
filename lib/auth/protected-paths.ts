import { getSafeInternalPath } from "@/lib/auth/safe-path";

export const AUTH_PATHS = ["/login", "/register", "/reset-password"] as const;

export const REQUEST_NEXT_HEADER = "x-qbook-next";

export function isAuthPath(pathname: string) {
  return (AUTH_PATHS as readonly string[]).includes(pathname);
}

export function isProtectedPath(pathname: string) {
  return pathname !== "/" && !isAuthPath(pathname);
}

export function getSafeLoginNextPath(value: string | null | undefined) {
  const safePath = getSafeInternalPath(value);
  if (!safePath) {
    return null;
  }

  const pathname = new URL(safePath, "https://qbook.invalid").pathname;
  if (!isProtectedPath(pathname)) {
    return null;
  }

  return safePath;
}

export function buildLoginRequiredPath(nextValue?: string | null) {
  const params = new URLSearchParams({ auth: "required" });
  const next = getSafeLoginNextPath(nextValue);

  if (next) {
    params.set("next", next);
  }

  return `/login?${params.toString()}`;
}
