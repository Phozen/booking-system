import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getMicrosoftCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { createAdminClient } from "@/lib/supabase/admin";

const encryptionPrefix = "v1";
const refreshSkewMs = 5 * 60 * 1000;
const defaultScopes = [
  "openid",
  "email",
  "profile",
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
];

export type MicrosoftCalendarConnectionStatus =
  | "connected"
  | "reconnect_required";

export type MicrosoftCalendarConnection = {
  user_id: string;
  microsoft_email: string;
  microsoft_tenant_id: string | null;
  microsoft_account_id: string | null;
  scopes: string[];
  encrypted_access_token: string | null;
  encrypted_refresh_token: string | null;
  access_token_expires_at: string | null;
  status: MicrosoftCalendarConnectionStatus;
  last_connected_at: string | null;
  last_refreshed_at: string | null;
  last_error: string | null;
};

type TokenClaims = {
  tid?: string;
  oid?: string;
  preferred_username?: string;
  upn?: string;
  email?: string;
  scp?: string;
  exp?: number;
};

type RefreshTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

function getEncryptionKey() {
  const config = getMicrosoftCalendarSyncConfig();
  const key = Buffer.from(config.delegatedTokenEncryptionKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  }

  return key;
}

export function encryptMicrosoftCalendarToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    encryptionPrefix,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptMicrosoftCalendarToken(encryptedToken: string) {
  const [version, iv, tag, encrypted] = encryptedToken.split(":");

  if (version !== encryptionPrefix || !iv || !tag || !encrypted) {
    throw new Error("Microsoft calendar token is not in a supported format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function decodeBase64UrlJson(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as unknown;
}

function decodeTokenClaims(accessToken: string): TokenClaims {
  const [, payload] = accessToken.split(".");

  if (!payload) {
    return {};
  }

  try {
    return decodeBase64UrlJson(payload) as TokenClaims;
  } catch {
    return {};
  }
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getExpiresAt({
  expiresAt,
  expiresIn,
  claims,
}: {
  expiresAt?: number | null;
  expiresIn?: number | null;
  claims: TokenClaims;
}) {
  if (expiresAt) {
    return new Date(expiresAt * 1000).toISOString();
  }

  if (expiresIn) {
    return new Date(Date.now() + expiresIn * 1000).toISOString();
  }

  if (claims.exp) {
    return new Date(claims.exp * 1000).toISOString();
  }

  return new Date(Date.now() + 3600 * 1000).toISOString();
}

function getScopes(claims: TokenClaims, scope?: string | null) {
  const values = scope || claims.scp || defaultScopes.join(" ");
  return values
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function saveMicrosoftDelegatedCalendarConnection({
  userId,
  userEmail,
  accessToken,
  refreshToken,
  expiresAt,
  expiresIn,
  scope,
}: {
  userId: string;
  userEmail: string | null | undefined;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  expiresIn?: number | null;
  scope?: string | null;
}) {
  if (!accessToken && !refreshToken) {
    return null;
  }

  const supabase = createAdminClient();
  const existing = await getMicrosoftCalendarConnection(userId);
  const claims = accessToken ? decodeTokenClaims(accessToken) : {};
  const microsoftEmail = normalizeEmail(
    claims.preferred_username || claims.upn || claims.email || userEmail,
  );

  if (!microsoftEmail) {
    throw new Error("Microsoft calendar connection is missing an email address.");
  }

  const payload = {
    user_id: userId,
    microsoft_email: microsoftEmail,
    microsoft_tenant_id: claims.tid ?? existing?.microsoft_tenant_id ?? null,
    microsoft_account_id: claims.oid ?? existing?.microsoft_account_id ?? null,
    scopes: getScopes(claims, scope),
    encrypted_access_token: accessToken
      ? encryptMicrosoftCalendarToken(accessToken)
      : existing?.encrypted_access_token ?? null,
    encrypted_refresh_token: refreshToken
      ? encryptMicrosoftCalendarToken(refreshToken)
      : existing?.encrypted_refresh_token ?? null,
    access_token_expires_at: accessToken
      ? getExpiresAt({ expiresAt, expiresIn, claims })
      : existing?.access_token_expires_at ?? null,
    status: "connected",
    last_connected_at: new Date().toISOString(),
    last_error: null,
  };

  const { data, error } = await supabase
    .from("microsoft_calendar_connections")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "user_id,microsoft_email,microsoft_tenant_id,microsoft_account_id,scopes,encrypted_access_token,encrypted_refresh_token,access_token_expires_at,status,last_connected_at,last_refreshed_at,last_error",
    )
    .single();

  if (error) {
    throw new Error(`Microsoft calendar connection save failed: ${error.message}`);
  }

  return data as MicrosoftCalendarConnection;
}

export async function getMicrosoftCalendarConnection(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("microsoft_calendar_connections")
    .select(
      "user_id,microsoft_email,microsoft_tenant_id,microsoft_account_id,scopes,encrypted_access_token,encrypted_refresh_token,access_token_expires_at,status,last_connected_at,last_refreshed_at,last_error",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Microsoft calendar connection lookup failed: ${error.message}`,
    );
  }

  return data ? (data as MicrosoftCalendarConnection) : null;
}

async function markReconnectRequired(userId: string, error: unknown) {
  const supabase = createAdminClient();
  const sanitized = sanitizeMicrosoftCalendarError(error);

  await supabase
    .from("microsoft_calendar_connections")
    .update({
      status: "reconnect_required",
      last_error: sanitized,
    })
    .eq("user_id", userId);
}

async function refreshMicrosoftDelegatedAccessToken(
  connection: MicrosoftCalendarConnection,
) {
  const config = getMicrosoftCalendarSyncConfig();

  if (!connection.encrypted_refresh_token) {
    throw new Error(
      "Microsoft calendar connection needs reconnecting before calendar sync can run.",
    );
  }

  const refreshToken = decryptMicrosoftCalendarToken(
    connection.encrypted_refresh_token,
  );
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
    config.tenantId,
  )}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: defaultScopes.join(" "),
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const payload = (await response
    .json()
    .catch(() => ({}))) as RefreshTokenResponse;

  if (!response.ok || !payload.access_token) {
    const details =
      payload.error_description || payload.error || response.statusText;
    throw new Error(
      `Microsoft delegated token refresh failed (${response.status}): ${details}`,
    );
  }

  const claims = decodeTokenClaims(payload.access_token);
  const encryptedAccessToken = encryptMicrosoftCalendarToken(
    payload.access_token,
  );
  const encryptedRefreshToken = payload.refresh_token
    ? encryptMicrosoftCalendarToken(payload.refresh_token)
    : connection.encrypted_refresh_token;
  const expiresAt = getExpiresAt({
    expiresIn: payload.expires_in,
    claims,
  });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("microsoft_calendar_connections")
    .update({
      microsoft_email: normalizeEmail(
        claims.preferred_username ||
          claims.upn ||
          claims.email ||
          connection.microsoft_email,
      ),
      microsoft_tenant_id: claims.tid ?? connection.microsoft_tenant_id,
      microsoft_account_id: claims.oid ?? connection.microsoft_account_id,
      scopes: getScopes(claims, payload.scope),
      encrypted_access_token: encryptedAccessToken,
      encrypted_refresh_token: encryptedRefreshToken,
      access_token_expires_at: expiresAt,
      status: "connected",
      last_refreshed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("user_id", connection.user_id)
    .select(
      "user_id,microsoft_email,microsoft_tenant_id,microsoft_account_id,scopes,encrypted_access_token,encrypted_refresh_token,access_token_expires_at,status,last_connected_at,last_refreshed_at,last_error",
    )
    .single();

  if (error) {
    throw new Error(
      `Microsoft calendar connection refresh save failed: ${error.message}`,
    );
  }

  return {
    connection: data as MicrosoftCalendarConnection,
    accessToken: payload.access_token,
  };
}

export async function getMicrosoftDelegatedAccessToken(userId: string) {
  const connection = await getMicrosoftCalendarConnection(userId);

  if (!connection) {
    return {
      ok: false as const,
      error:
        "Booking owner has not connected Microsoft Calendar. Ask the user to reconnect Microsoft Calendar from their profile.",
    };
  }

  if (connection.status !== "connected") {
    return {
      ok: false as const,
      error:
        "Booking owner's Microsoft Calendar connection needs reconnecting before calendar sync can run.",
      connection,
    };
  }

  const expiresAtMs = connection.access_token_expires_at
    ? Date.parse(connection.access_token_expires_at)
    : 0;

  if (
    connection.encrypted_access_token &&
    expiresAtMs > Date.now() + refreshSkewMs
  ) {
    try {
      return {
        ok: true as const,
        accessToken: decryptMicrosoftCalendarToken(
          connection.encrypted_access_token,
        ),
        connection,
      };
    } catch (error) {
      await markReconnectRequired(connection.user_id, error);
      return {
        ok: false as const,
        error:
          "Booking owner's Microsoft Calendar connection could not be decrypted. Ask the user to reconnect Microsoft Calendar.",
        connection,
      };
    }
  }

  try {
    const refreshed = await refreshMicrosoftDelegatedAccessToken(connection);
    return {
      ok: true as const,
      accessToken: refreshed.accessToken,
      connection: refreshed.connection,
    };
  } catch (error) {
    await markReconnectRequired(connection.user_id, error);
    return {
      ok: false as const,
      error:
        "Booking owner's Microsoft Calendar connection expired or was revoked. Ask the user to reconnect Microsoft Calendar.",
      connection,
    };
  }
}

export async function getOwnMicrosoftCalendarConnectionStatus(userId: string) {
  const connection = await getMicrosoftCalendarConnection(userId).catch(() => null);

  if (!connection) {
    return {
      connected: false,
      status: "not_connected" as const,
      microsoftEmail: null,
      lastConnectedAt: null,
      lastError: null,
    };
  }

  return {
    connected: connection.status === "connected",
    status: connection.status,
    microsoftEmail: connection.microsoft_email,
    lastConnectedAt: connection.last_connected_at,
    lastError: connection.last_error,
  };
}
