"use server";

import { redirect } from "next/navigation";

import { appConfig } from "@/config/app";
import { getPostLoginPath } from "@/lib/auth/session";
import {
  getFormValue,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";
import {
  formatRegistrationDisabledMessage,
  getRegistrationSettings,
  isEmailAllowedByDomain,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  status: "error" | "success";
  message: string;
};

function setupMessage() {
  return "Supabase is not configured yet. Add your project URL and anon key to .env.local, then restart the dev server.";
}

function friendlyAuthError(
  fallback: string,
  error?: { code?: string; message?: string; status?: number },
  registrationDisabledMessage = "Registration is currently disabled. Contact an administrator for access.",
) {
  if (!error) {
    return fallback;
  }

  if (error.code === "email_address_invalid") {
    return "Use a real email address. Placeholder domains are not accepted.";
  }

  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "Too many signup emails were requested. Wait a few minutes, then try again.";
  }

  if (
    error.code === "user_already_exists" ||
    error.message?.toLowerCase().includes("already registered")
  ) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (
    error.code === "signup_disabled" ||
    error.message?.toLowerCase().includes("signups not allowed")
  ) {
    return registrationDisabledMessage;
  }

  if (error.code === "weak_password") {
    return "Use a stronger password, then try again.";
  }

  return fallback;
}

export async function loginAction(
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check your email and password, then try again.",
    };
  }

  let redirectTo = "/dashboard";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(
      parsed.data,
    );

    if (error || !data.user) {
      return {
        status: "error",
        message: "Invalid email or password.",
      };
    }

    redirectTo = await getPostLoginPath(supabase, data.user);
  } catch {
    return {
      status: "error",
      message: setupMessage(),
    };
  }

  redirect(redirectTo);
}

export async function registerAction(
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: getFormValue(formData, "fullName"),
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
    confirmPassword: getFormValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the registration details, then try again.",
    };
  }

  try {
    const registrationSettings = await getRegistrationSettings();

    if (!registrationSettings.registrationEnabled) {
      return {
        status: "error",
        message: formatRegistrationDisabledMessage(registrationSettings),
      };
    }

    if (
      !isEmailAllowedByDomain(
        parsed.data.email,
        registrationSettings.allowedEmailDomains,
      )
    ) {
      return {
        status: "error",
        message: "Use an approved company email domain to register.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
      },
    });

    if (error) {
      console.error("Supabase registration failed", {
        code: error.code,
        status: error.status,
        message: error.message,
      });

      return {
        status: "error",
        message: friendlyAuthError(
          "Registration could not be completed.",
          error,
          formatRegistrationDisabledMessage(registrationSettings),
        ),
      };
    }
  } catch {
    return {
      status: "error",
      message: setupMessage(),
    };
  }

  return {
    status: "success",
    message:
      "Account request submitted. If email verification is enabled, check your inbox before logging in.",
  };
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    email: getFormValue(formData, "email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${appConfig.appUrl}/reset-password`,
      },
    );

    if (error) {
      return {
        status: "error",
        message:
          "Password reset could not be requested. Check the email and try again.",
      };
    }
  } catch {
    return {
      status: "error",
      message: setupMessage(),
    };
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, password reset instructions will be sent.",
  };
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
