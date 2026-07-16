import { describe, expect, it } from "vitest";

import {
  getMicrosoftTenantId,
  isMicrosoftAuthUser,
  normalizeAccessEmail,
} from "@/lib/auth/access";

const tenantId = "11111111-2222-4333-8444-555555555555";

describe("Microsoft access identity checks", () => {
  it("normalizes exact email addresses without granting by domain", () => {
    expect(normalizeAccessEmail("  Jane.Employee@Example.COM ")).toBe(
      "jane.employee@example.com",
    );
    expect(normalizeAccessEmail("other@example.com")).not.toBe(
      normalizeAccessEmail("jane.employee@example.com"),
    );
  });

  it("accepts only the trusted Azure provider marker", () => {
    expect(isMicrosoftAuthUser({ app_metadata: { provider: "azure" } })).toBe(
      true,
    );
    expect(isMicrosoftAuthUser({ app_metadata: { provider: "email" } })).toBe(
      false,
    );
    expect(isMicrosoftAuthUser({ app_metadata: {} })).toBe(false);
  });

  it("extracts the tenant from a trusted provider token", () => {
    const payload = Buffer.from(JSON.stringify({ tid: tenantId })).toString(
      "base64url",
    );

    expect(
      getMicrosoftTenantId({
        user: { identities: [], user_metadata: {} },
        providerToken: `header.${payload}.signature`,
      }),
    ).toBe(tenantId);
  });

  it("rejects identities with no tenant evidence", () => {
    expect(
      getMicrosoftTenantId({
        user: { identities: [], user_metadata: {} },
        providerToken: "not-a-jwt",
      }),
    ).toBeNull();
  });
});
