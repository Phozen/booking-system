import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const { getEmailCronMonitor, recordEmailCronRun } = await import(
  "@/lib/email/cron-health"
);

function createSupabase({ value, error = null }: { value?: unknown; error?: unknown } = {}) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: value === undefined ? null : { value }, error });

  return {
    from: vi.fn(() => ({
      ...query,
      upsert: vi.fn().mockResolvedValue({ error }),
    })),
  };
}

describe("email automation heartbeat", () => {
  const now = new Date("2035-01-01T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records only a safe completion timestamp and health state", async () => {
    const supabase = createSupabase();

    await expect(recordEmailCronRun(true, supabase as never, now)).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("system_settings");
    const settings = supabase.from.mock.results[0]?.value;
    expect(settings.upsert).toHaveBeenCalledWith(
      {
        key: "email_cron_last_run",
        value: { completedAt: now.toISOString(), healthy: true },
        description: "Internal email automation heartbeat. Managed by Qbook.",
        is_public: false,
      },
      { onConflict: "key" },
    );
  });

  it("reports an unreadable heartbeat safely", async () => {
    const supabase = createSupabase({ error: { message: "permission denied" } });

    await expect(getEmailCronMonitor(supabase as never, now)).resolves.toMatchObject({
      readable: false,
      healthy: false,
      stale: true,
      lastRunAt: null,
    });
  });

  it("warns when no healthy scheduler cycle has run within the configured limit", async () => {
    const supabase = createSupabase({
      value: { completedAt: "2035-01-01T11:40:00.000Z", healthy: true },
    });

    await expect(
      getEmailCronMonitor(supabase as never, now, { EMAIL_CRON_MAX_AGE_MINUTES: "15" }),
    ).resolves.toMatchObject({ stale: true, healthy: false, maxAgeMinutes: 15 });
  });

  it("accepts a recent healthy scheduler cycle", async () => {
    const supabase = createSupabase({
      value: { completedAt: "2035-01-01T11:50:00.000Z", healthy: true },
    });

    await expect(
      getEmailCronMonitor(supabase as never, now, { EMAIL_CRON_MAX_AGE_MINUTES: "15" }),
    ).resolves.toMatchObject({ stale: false, healthy: true, lastRunHealthy: true });
  });
});
