"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { appConfig } from "@/config/app";
import { getSafeInternalPath } from "@/lib/auth/safe-path";
import {
  getMicrosoftCalendarSyncConfig,
  isDelegatedBookingOwnerCalendarSyncReady,
} from "@/lib/integrations/microsoft-365-calendar/config";
import { createClient } from "@/lib/supabase/server";

export async function loginWithMicrosoftAction(formData?: FormData): Promise<void> {
  let microsoftLoginUrl = "";
  let errorRedirect = "";
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? appConfig.appUrl;
  const configuredTenantId = process.env.MICROSOFT_TENANT_ID?.trim();
  const submittedNext = formData?.get("next");
  const next = getSafeInternalPath(
    typeof submittedNext === "string" ? submittedNext : null,
  );

  if (!configuredTenantId) {
    redirect(`${origin}/login?error=tenant`);
  }

  try {
    const supabase = await createClient();
    const callbackUrl = new URL("/auth/callback", origin);
    if (next) {
      callbackUrl.searchParams.set("next", next);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: callbackUrl.toString(),
        // Calendar access is a separate, opt-in connection below. Basic Qbook
        // access needs only the identity claims used by Supabase and the app.
        scopes: "openid email profile",
        // Do not silently reuse whichever Microsoft account happens to be
        // signed in to the browser. Qbook checks the company Microsoft tenant
        // and authorized email domain after sign-in.
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error || !data.url) {
      errorRedirect = `${origin}/login?error=microsoft`;
    } else {
      microsoftLoginUrl = data.url;
    }
  } catch {
    errorRedirect = `${origin}/login?error=callback`;
  }

  if (errorRedirect) {
    redirect(errorRedirect);
  }

  redirect(microsoftLoginUrl);
}

export async function connectMicrosoftCalendarAction(): Promise<void> {
  let microsoftLoginUrl = "";
  let errorRedirect = "";
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? appConfig.appUrl;

  if (
    !isDelegatedBookingOwnerCalendarSyncReady(
      getMicrosoftCalendarSyncConfig(),
    )
  ) {
    redirect(`${origin}/profile?calendar=unavailable`);
  }

  try {
    const supabase = await createClient();
    const redirectTo = `${origin}/auth/callback?next=/profile&calendar=connected`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo,
        scopes: "openid email profile offline_access User.Read Calendars.ReadWrite",
        queryParams: {
          prompt: "consent",
        },
      },
    });

    if (error || !data.url) {
      errorRedirect = `${origin}/profile?calendar=error`;
    } else {
      microsoftLoginUrl = data.url;
    }
  } catch {
    errorRedirect = `${origin}/profile?calendar=error`;
  }

  if (errorRedirect) {
    redirect(errorRedirect);
  }

  redirect(microsoftLoginUrl);
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // A missing Supabase config still ends the local app session flow.
  }

  redirect("/login");
}
