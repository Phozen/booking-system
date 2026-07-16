import { NextResponse, type NextRequest } from "next/server";

import {
  getMicrosoftTenantId,
  isMicrosoftAuthUser,
} from "@/lib/auth/access";
import { getPostLoginPath } from "@/lib/auth/session";
import { saveMicrosoftDelegatedCalendarConnection } from "@/lib/integrations/microsoft-365-calendar/delegated";
import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const next = requestUrl.searchParams.get("next");
  const calendar = requestUrl.searchParams.get("calendar");
  const origin = requestUrl.origin;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=microsoft`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  try {
    supabase = await createClient();
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }

    const session = data.session as
      | (typeof data.session & {
          provider_token?: string | null;
          provider_refresh_token?: string | null;
          expires_at?: number | null;
          expires_in?: number | null;
          token_type?: string | null;
        })
      | null;
    const providerToken = session?.provider_token ?? null;
    const providerRefreshToken = session?.provider_refresh_token ?? null;

    if (!isMicrosoftAuthUser(data.user)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=microsoft`);
    }

    const admin = createAdminClient();
    const { data: accessConfig, error: accessConfigError } = await admin
      .from("microsoft_access_config")
      .select("tenant_id")
      .eq("singleton", true)
      .maybeSingle();
    const actualTenantId = getMicrosoftTenantId({
      user: data.user,
      providerToken,
    });

    if (
      accessConfigError ||
      !accessConfig?.tenant_id ||
      !actualTenantId ||
      actualTenantId !== String(accessConfig.tenant_id).toLowerCase()
    ) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=tenant`);
    }

    const redirectTo = await getPostLoginPath(supabase, data.user);
    if (redirectTo.startsWith("/login")) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    let calendarConnectionSaved = false;
    let calendarConnectionAttempted = false;

    // A normal Qbook sign-in must never persist delegated Microsoft calendar
    // credentials. They are requested only by the explicit calendar-connect
    // flow, which returns with this marker after the same tenant/access checks.
    if (calendar === "connected" && (providerToken || providerRefreshToken)) {
      calendarConnectionAttempted = true;
      try {
        await saveMicrosoftDelegatedCalendarConnection({
          userId: data.user.id,
          userEmail: data.user.email,
          accessToken: providerToken,
          refreshToken: providerRefreshToken,
          expiresAt: session?.expires_at,
          expiresIn: session?.expires_in,
        });
        calendarConnectionSaved = true;
      } catch (tokenError) {
        console.error("Microsoft delegated calendar connection save failed", {
          userId: data.user.id,
          message: sanitizeMicrosoftCalendarError(tokenError),
        });
      }
    }

    if (calendar === "connected" && next?.startsWith("/")) {
      const status =
        calendarConnectionAttempted && calendarConnectionSaved
          ? "connected"
          : "error";
      return NextResponse.redirect(`${origin}${next}?calendar=${status}`);
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continue to the fail-closed redirect even if cookie cleanup fails.
      }
    }

    return NextResponse.redirect(`${origin}/login?error=callback`);
  }
}
