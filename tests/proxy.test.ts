import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

describe("proxy route matching", () => {
  it("lets the Microsoft callback exchange its code before session enforcement", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/auth/callback?code=temporary-code",
      }),
    ).toBe(false);
  });

  it("continues to enforce application routes", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/admin/dashboard",
      }),
    ).toBe(true);
  });
});
