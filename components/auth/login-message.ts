import {
  formatAccountInactiveMessage,
  type AppSettings,
} from "@/lib/settings/app-settings";

export type LoginSearchParams = Record<string, string | string[] | undefined>;

export function getLoginMessage(
  searchParams: LoginSearchParams,
  settings: Pick<AppSettings, "systemContactEmail">,
) {
  if (searchParams.auth === "required") {
    return "Log in to continue.";
  }

  if (searchParams.error === "disabled") {
    return formatAccountInactiveMessage(settings);
  }

  if (searchParams.error === "legacy") {
    return "Email and password sign-in is disabled. Continue with Microsoft.";
  }

  if (searchParams.error === "microsoft") {
    return "Microsoft login was cancelled or denied. Try again with your authorized company account.";
  }

  if (searchParams.error === "tenant") {
    return "That Microsoft tenant is not authorized for Qbook.";
  }

  if (searchParams.error === "callback") {
    return "Microsoft login could not be completed. Check Supabase and Microsoft redirect settings.";
  }

  return undefined;
}
