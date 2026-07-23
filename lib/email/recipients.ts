import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  baseDefaultAppSettings,
  type AppSettings,
  type EmailRecipientRole,
} from "@/lib/settings/app-settings";

export type EmailRecipientGroup =
  | "bookingOwnerConfirmations"
  | "companyBookingConfirmations"
  | "cateringRequests";

export type ActiveEmailRecipient = {
  id: string;
  email: string;
  role: EmailRecipientRole;
};

export function shouldSendEmailToRole(
  settings: Pick<AppSettings, "emailRecipients">,
  group: EmailRecipientGroup,
  role: string | null | undefined,
) {
  const roles =
    settings.emailRecipients?.[group] ??
    baseDefaultAppSettings.emailRecipients[group];

  return Boolean(
    role &&
      roles.includes(role as EmailRecipientRole),
  );
}

export async function getActiveEmailRecipients(
  supabase: SupabaseClient,
  settings: Pick<AppSettings, "emailRecipients">,
  group: EmailRecipientGroup,
) {
  const roles =
    settings.emailRecipients?.[group] ??
    baseDefaultAppSettings.emailRecipients[group];

  if (roles.length === 0) {
    return [] as ActiveEmailRecipient[];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role")
    .in("role", roles)
    .eq("status", "active");

  if (error) {
    throw new Error("Email recipients could not be loaded.");
  }

  return ((data ?? []) as ActiveEmailRecipient[]).filter(
    (recipient) => recipient.email,
  );
}
