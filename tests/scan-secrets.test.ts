import { describe, expect, it } from "vitest";

import {
  collectTextFindings,
  isAllowedJwt,
} from "../scripts/scan-secrets.mjs";

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeJwt(payload: Record<string, unknown>) {
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.${"x".repeat(16)}`;
}

describe("secret scanner JWT allowlist", () => {
  it("allows the published local supabase-demo issuer", () => {
    const token = makeJwt({ iss: "supabase-demo", role: "anon" });

    expect(isAllowedJwt(token)).toBe(true);
    expect(collectTextFindings(`const key = "${token}";`)).toEqual([]);
  });

  it("still rejects hosted Supabase JWTs", () => {
    const token = makeJwt({
      iss: "https://example.supabase.co/auth/v1",
      role: "authenticated",
    });

    expect(isAllowedJwt(token)).toBe(false);
    expect(collectTextFindings(token)).toEqual([
      { rule: "JWT", location: "test:1" },
    ]);
  });
});
