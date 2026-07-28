import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getEmailAppUrlConfig } = await import("@/lib/email/app-url");

describe("email app URL validation", () => {
  it("uses the canonical origin for production email links", () => {
    expect(
      getEmailAppUrlConfig({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://qbook.example.com/path/ignored",
      }),
    ).toEqual({ appUrl: "https://qbook.example.com", validationError: null });
  });

  it("blocks missing or localhost production links", () => {
    expect(getEmailAppUrlConfig({ NODE_ENV: "production" }).appUrl).toBeNull();
    expect(
      getEmailAppUrlConfig({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }).validationError,
    ).toMatch(/public HTTPS/i);
  });
});
