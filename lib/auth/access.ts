import type { User } from "@supabase/supabase-js";

export function normalizeAccessEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isMicrosoftAuthUser(
  user: { app_metadata?: Record<string, unknown> } | null | undefined,
) {
  return user?.app_metadata?.provider === "azure";
}

function tenantFromIssuer(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return (
    value.match(
      /https:\/\/login\.microsoftonline\.com\/([0-9a-f-]{36})(?:\/|$)/i,
    )?.[1] ??
    value.match(/https:\/\/sts\.windows\.net\/([0-9a-f-]{36})(?:\/|$)/i)?.[1] ??
    null
  )?.toLowerCase() ?? null;
}

function decodeJwtPayload(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export function getMicrosoftTenantId({
  user,
  providerToken,
}: {
  user: Pick<User, "identities" | "user_metadata">;
  providerToken?: string | null;
}) {
  const tokenPayload = decodeJwtPayload(providerToken);
  const tokenTenant = tokenPayload?.tid;
  if (typeof tokenTenant === "string" && tokenTenant.length > 0) {
    return tokenTenant.toLowerCase();
  }

  for (const identity of user.identities ?? []) {
    const identityData = identity.identity_data ?? {};
    const tenant = identityData.tid;
    if (typeof tenant === "string" && tenant.length > 0) {
      return tenant.toLowerCase();
    }

    const issuerTenant = tenantFromIssuer(identityData.iss);
    if (issuerTenant) {
      return issuerTenant;
    }
  }

  const metadataTenant = user.user_metadata?.tid;
  if (typeof metadataTenant === "string" && metadataTenant.length > 0) {
    return metadataTenant.toLowerCase();
  }

  return tenantFromIssuer(user.user_metadata?.iss);
}
