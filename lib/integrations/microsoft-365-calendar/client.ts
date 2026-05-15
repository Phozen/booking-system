import "server-only";

import { getMicrosoftCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import { getMicrosoftGraphAccessToken } from "@/lib/integrations/microsoft-365-calendar/auth";

export type MicrosoftGraphFetchResult<T> =
  | { ok: true; status: number; data: T | null }
  | { ok: false; status: number; error: string; code?: string };

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function buildMicrosoftGraphPath(...segments: string[]) {
  return segments
    .map((segment) => trimSlashes(segment))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function microsoftGraphFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<MicrosoftGraphFetchResult<T>> {
  const config = getMicrosoftCalendarSyncConfig();

  if (!config.enabled || config.mode === "disabled") {
    return {
      ok: false,
      status: 0,
      error: "Microsoft 365 Calendar sync is disabled.",
    };
  }

  if (!config.isConfigured) {
    return {
      ok: false,
      status: 0,
      error:
        config.validationError ??
        "Microsoft 365 Calendar sync is not configured.",
    };
  }

  try {
    const token = await getMicrosoftGraphAccessToken();
    const url = `${trimSlashes(config.graphBaseUrl)}/${trimSlashes(path)}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.status === 204) {
      return { ok: true, status: response.status, data: null };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok) {
      const graphError =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        payload.error &&
        typeof payload.error === "object"
          ? (payload.error as { code?: string; message?: string })
          : null;

      return {
        ok: false,
        status: response.status,
        code: graphError?.code,
        error: sanitizeMicrosoftCalendarError(
          `Microsoft Graph request failed (${response.status})${
            graphError?.code ? ` ${graphError.code}` : ""
          }: ${graphError?.message ?? response.statusText}`,
        ),
      };
    }

    return { ok: true, status: response.status, data: payload as T };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: sanitizeMicrosoftCalendarError(error),
    };
  }
}
