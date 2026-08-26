import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getDashboardPathForRole,
  getProfileSession,
  isAdminRole,
} from "@/lib/auth/profile";
import {
  REQUEST_NEXT_HEADER,
  buildLoginRequiredPath,
  isAuthPath,
  isProtectedPath,
} from "@/lib/auth/protected-paths";
import { hasSupabaseAuthCookie } from "@/lib/auth/session-cookies";

function hasSupabaseMiddlewareConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function getRequestedPath(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function continueWithRequestedPath(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_NEXT_HEADER, getRequestedPath(request));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(
    new URL(buildLoginRequiredPath(getRequestedPath(request)), request.url),
  );
}

export async function updateSession(request: NextRequest) {
  let response = continueWithRequestedPath(request);
  const pathname = request.nextUrl.pathname;

  if (!hasSupabaseMiddlewareConfig()) {
    if (isProtectedPath(pathname)) {
      return redirectToLogin(request);
    }

    return response;
  }

  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
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

          response = continueWithRequestedPath(request);

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

  const profile = await getProfileSession(supabase, user);
  if (!profile || profile.status !== "active") {
    if (isAuthPath(pathname)) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "disabled");

    return NextResponse.redirect(redirectUrl);
  }

  const role = profile.role;

  if (isAuthPath(pathname)) {
    return NextResponse.redirect(
      new URL(getDashboardPathForRole(role), request.url),
    );
  }

  if (pathname.startsWith("/admin") && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
