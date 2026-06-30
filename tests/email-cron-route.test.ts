import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processQueuedEmailNotifications: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/email", () => ({
  processQueuedEmailNotifications: mocks.processQueuedEmailNotifications,
}));

const { GET } = await import("@/app/api/cron/email/process/route");

function request({
  secret,
  limit,
}: {
  secret?: string;
  limit?: string;
} = {}) {
  const url = new URL("https://example.com/api/cron/email/process");

  if (limit != null) {
    url.searchParams.set("limit", limit);
  }

  return new Request(url, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("email processing cron route", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mocks.processQueuedEmailNotifications.mockResolvedValue({
      processed: 1,
      sent: 1,
      failed: 0,
      retried: 0,
      skipped: 0,
      message: "Processed 1 queued email.",
      body: "should not leak",
      templateData: { secret: "should not leak" },
    });
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("returns 500 when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request({ secret: "anything" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      errors: ["Cron processing is not configured."],
    });
    expect(mocks.processQueuedEmailNotifications).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization is missing", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      errors: ["Unauthorized."],
    });
    expect(mocks.processQueuedEmailNotifications).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization is wrong", async () => {
    const response = await GET(request({ secret: "wrong" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      errors: ["Unauthorized."],
    });
    expect(mocks.processQueuedEmailNotifications).not.toHaveBeenCalled();
  });

  it("calls processQueuedEmailNotifications with a valid Authorization header", async () => {
    const response = await GET(request({ secret: "test-cron-secret" }));

    expect(response.status).toBe(200);
    expect(mocks.processQueuedEmailNotifications).toHaveBeenCalledWith(25);
    await expect(response.json()).resolves.toEqual({
      processed: 1,
      sent: 1,
      failed: 0,
      retried: 0,
      skipped: 0,
      errors: [],
    });
  });

  it("bounds the limit query parameter", async () => {
    await GET(request({ secret: "test-cron-secret", limit: "999" }));
    await GET(request({ secret: "test-cron-secret", limit: "0" }));
    await GET(request({ secret: "test-cron-secret", limit: "not-a-number" }));

    expect(mocks.processQueuedEmailNotifications).toHaveBeenNthCalledWith(
      1,
      100,
    );
    expect(mocks.processQueuedEmailNotifications).toHaveBeenNthCalledWith(
      2,
      1,
    );
    expect(mocks.processQueuedEmailNotifications).toHaveBeenNthCalledWith(
      3,
      25,
    );
  });

  it("does not expose sensitive email body or template data", async () => {
    const response = await GET(request({ secret: "test-cron-secret" }));
    const text = await response.text();

    expect(text).not.toContain("should not leak");
    expect(text).not.toContain("templateData");
    expect(text).not.toContain("body");
  });

  it("returns a safe 500 when processing throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.processQueuedEmailNotifications.mockRejectedValue(new Error("provider secret"));

    const response = await GET(request({ secret: "test-cron-secret" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      errors: ["Email queue processing failed."],
    });
    consoleError.mockRestore();
  });

  it("does not configure a Vercel cron schedule", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const vercelConfig = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    );

    expect(vercelConfig.crons).toBeUndefined();
  });
});
