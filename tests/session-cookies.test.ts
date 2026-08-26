import { describe, expect, it } from "vitest";

import { hasSupabaseAuthCookie } from "@/lib/auth/session-cookies";

describe("hasSupabaseAuthCookie", () => {
  it("is false when the browser has no session cookie", () => {
    expect(hasSupabaseAuthCookie([])).toBe(false);
    expect(hasSupabaseAuthCookie([{ name: "theme", value: "dark" }])).toBe(
      false,
    );
  });

  it("detects a Supabase auth token cookie", () => {
    expect(
      hasSupabaseAuthCookie([
        { name: "sb-example-auth-token", value: "redacted" },
      ]),
    ).toBe(true);
  });
});
