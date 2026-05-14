import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getDashboardPathForRole,
  getProfileSession,
  isAdminRole,
} from "@/lib/auth/profile";

const authPaths = new Set(["/login", "/register", "/reset-password"]);

const protectedPrefixes = [
  "/dashboard",
  "/facilities",
  "/bookings",
  "/my-bookings",
  "/profile",
  "/admin",
];

function hasSupabaseMiddlewareConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("auth", "required");

  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;

  if (!hasSupabaseMiddlewareConfig()) {
    if (isProtectedPath(pathname)) {
      return redirectToLogin(request);
    }

    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    return redirectToLogin(request);
  }

  if (!user) {
    return response;
  }

  const profile = await getProfileSession(supabase, user.id);
  if (!profile || profile.status !== "active") {
    if (authPaths.has(pathname)) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "disabled");

    return NextResponse.redirect(redirectUrl);
  }

  const role = profile.role;

  if (authPaths.has(pathname)) {
    return NextResponse.redirect(
      new URL(getDashboardPathForRole(role), request.url),
    );
  }

  if (pathname.startsWith("/admin") && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
