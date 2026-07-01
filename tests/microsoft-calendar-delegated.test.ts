import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type ConnectionRow = Record<string, unknown> & { user_id: string };

const rows = new Map<string, ConnectionRow>();

function createBuilder() {
  let selectedRow: ConnectionRow | null = null;
  let pendingUpdate: Record<string, unknown> | null = null;

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: string) => {
      if (column === "user_id") {
        if (pendingUpdate) {
          const current = rows.get(value);
          if (current) {
            selectedRow = { ...current, ...pendingUpdate };
            rows.set(value, selectedRow);
          }
        } else {
          selectedRow = rows.get(value) ?? null;
        }
      }
      return builder;
    }),
    maybeSingle: vi.fn(async () => ({
      data: selectedRow,
      error: null,
    })),
    single: vi.fn(async () => ({
      data: selectedRow,
      error: null,
    })),
    upsert: vi.fn((payload: ConnectionRow) => {
      const current = rows.get(payload.user_id);
      selectedRow = { ...current, ...payload };
      rows.set(payload.user_id, selectedRow);
      return builder;
    }),
    update: vi.fn((payload: Record<string, unknown>) => {
      pendingUpdate = payload;
      return builder;
    }),
  };

  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => createBuilder(),
  }),
}));

function jwt(claims: Record<string, unknown>) {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value))
      .toString("base64url");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(claims)}.signature`;
}

describe("Microsoft delegated calendar tokens", () => {
  beforeEach(() => {
    rows.clear();
    vi.unstubAllGlobals();
    process.env.CALENDAR_SYNC_PROVIDER = "microsoft_graph";
    process.env.MICROSOFT_365_CALENDAR_SYNC_ENABLED = "true";
    process.env.MICROSOFT_SYNC_MODE = "booking_owner_calendar";
    process.env.MICROSOFT_GRAPH_AUTH_MODE = "delegated";
    process.env.MICROSOFT_TENANT_ID = "tenant-id";
    process.env.MICROSOFT_CLIENT_ID = "client-id";
    process.env.MICROSOFT_CLIENT_SECRET = "client-secret";
    process.env.MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY =
      "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
  });

  it("encrypts delegated tokens and can decrypt them", async () => {
    const {
      decryptMicrosoftCalendarToken,
      encryptMicrosoftCalendarToken,
    } = await import("@/lib/integrations/microsoft-365-calendar/delegated");

    const encrypted = encryptMicrosoftCalendarToken("plain-token");

    expect(encrypted).not.toContain("plain-token");
    expect(decryptMicrosoftCalendarToken(encrypted)).toBe("plain-token");
  });

  it("preserves an existing refresh token when Microsoft omits a new one", async () => {
    const {
      decryptMicrosoftCalendarToken,
      saveMicrosoftDelegatedCalendarConnection,
    } = await import("@/lib/integrations/microsoft-365-calendar/delegated");
    const firstAccessToken = jwt({
      preferred_username: "owner@example.com",
      tid: "tenant-id",
      oid: "account-id",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const secondAccessToken = jwt({
      preferred_username: "owner@example.com",
      tid: "tenant-id",
      oid: "account-id",
      exp: Math.floor(Date.now() / 1000) + 7200,
    });

    await saveMicrosoftDelegatedCalendarConnection({
      userId: "user-1",
      userEmail: "owner@example.com",
      accessToken: firstAccessToken,
      refreshToken: "refresh-token-1",
    });
    const saved = await saveMicrosoftDelegatedCalendarConnection({
      userId: "user-1",
      userEmail: "owner@example.com",
      accessToken: secondAccessToken,
      refreshToken: null,
    });

    expect(saved?.encrypted_refresh_token).toBeTruthy();
    expect(decryptMicrosoftCalendarToken(saved?.encrypted_refresh_token ?? "")).toBe(
      "refresh-token-1",
    );
  });

  it("refreshes expired access tokens and updates encrypted storage", async () => {
    const {
      decryptMicrosoftCalendarToken,
      getMicrosoftDelegatedAccessToken,
      saveMicrosoftDelegatedCalendarConnection,
    } = await import("@/lib/integrations/microsoft-365-calendar/delegated");
    const expiredAccessToken = jwt({
      preferred_username: "owner@example.com",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const refreshedAccessToken = jwt({
      preferred_username: "owner@example.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await saveMicrosoftDelegatedCalendarConnection({
      userId: "user-1",
      userEmail: "owner@example.com",
      accessToken: expiredAccessToken,
      refreshToken: "refresh-token-1",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: refreshedAccessToken,
          refresh_token: "refresh-token-2",
          expires_in: 3600,
          scope: "Calendars.ReadWrite User.Read offline_access",
        }),
      })),
    );

    const result = await getMicrosoftDelegatedAccessToken("user-1");
    const row = rows.get("user-1");

    expect(result.ok).toBe(true);
    expect(result.ok ? result.accessToken : "").toBe(refreshedAccessToken);
    expect(
      decryptMicrosoftCalendarToken(
        String(row?.encrypted_refresh_token ?? ""),
      ),
    ).toBe("refresh-token-2");
    expect(row?.status).toBe("connected");
  });

  it("marks the connection reconnect-required when refresh fails", async () => {
    const {
      getMicrosoftDelegatedAccessToken,
      saveMicrosoftDelegatedCalendarConnection,
    } = await import("@/lib/integrations/microsoft-365-calendar/delegated");
    const expiredAccessToken = jwt({
      preferred_username: "owner@example.com",
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    await saveMicrosoftDelegatedCalendarConnection({
      userId: "user-1",
      userEmail: "owner@example.com",
      accessToken: expiredAccessToken,
      refreshToken: "bad-refresh-token",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "invalid_grant",
          error_description: "refresh_token secret-value expired",
        }),
      })),
    );

    const result = await getMicrosoftDelegatedAccessToken("user-1");
    const row = rows.get("user-1");

    expect(result.ok).toBe(false);
    expect(row?.status).toBe("reconnect_required");
    expect(String(row?.last_error)).not.toContain("bad-refresh-token");
  });
});
