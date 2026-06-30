import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queueDueBookingReminders: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/email/reminders", () => ({
  queueDueBookingReminders: mocks.queueDueBookingReminders,
}));

vi.mock("@/lib/email/send", () => ({
  sendNotificationEmail: vi.fn(),
}));

const { GET } = await import("@/app/api/cron/email/reminders/route");
const { sendNotificationEmail } = await import("@/lib/email/send");

function request(secret?: string) {
  return new Request("https://example.com/api/cron/email/reminders", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("email reminders cron route", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mocks.queueDueBookingReminders.mockResolvedValue({
      queued: 2,
      skipped: 1,
      body: "should not leak",
      templateData: { secret: "should not leak" },
    });
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("returns 500 when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request("anything"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      errors: ["Cron processing is not configured."],
    });
    expect(mocks.queueDueBookingReminders).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization is missing", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      errors: ["Unauthorized."],
    });
    expect(mocks.queueDueBookingReminders).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization is wrong", async () => {
    const response = await GET(request("wrong"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      errors: ["Unauthorized."],
    });
    expect(mocks.queueDueBookingReminders).not.toHaveBeenCalled();
  });

  it("queues reminders with valid Authorization", async () => {
    const response = await GET(request("test-cron-secret"));

    expect(response.status).toBe(200);
    expect(mocks.queueDueBookingReminders).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      queued: 2,
      skipped: 1,
      errors: [],
    });
  });

  it("does not expose sensitive email body or template data", async () => {
    const response = await GET(request("test-cron-secret"));
    const text = await response.text();

    expect(text).not.toContain("should not leak");
    expect(text).not.toContain("templateData");
    expect(text).not.toContain("body");
  });

  it("returns a safe 500 when reminder queueing throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.queueDueBookingReminders.mockRejectedValue(new Error("secret detail"));

    const response = await GET(request("test-cron-secret"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      errors: ["Booking reminders could not be queued."],
    });
    consoleError.mockRestore();
  });

  it("does not send emails directly", async () => {
    await GET(request("test-cron-secret"));

    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it("configures both Vercel cron entries", () => {
    const vercelConfig = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    );

    expect(vercelConfig.crons).toEqual(
      expect.arrayContaining([
        {
          path: "/api/cron/email/process",
          schedule: "*/5 * * * *",
        },
        {
          path: "/api/cron/email/reminders",
          schedule: "*/15 * * * *",
        },
      ]),
    );
  });
});
