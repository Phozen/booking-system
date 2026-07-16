import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { getEmailQueueHealth } from "@/lib/email/health";

function failingQuery() {
  const result = { data: null, count: null, error: { message: "query failed" } };
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.lte.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

describe("email queue health", () => {
  it("fails closed when queue count queries cannot be read", async () => {
    const supabase = { from: vi.fn(() => failingQuery()) };

    const health = await getEmailQueueHealth(
      supabase as never,
      new Date("2035-01-01T00:00:00.000Z"),
    );

    expect(health.healthy).toBe(false);
    expect(health.overdueQueued).toBe(-1);
    expect(health.staleSending).toBe(-1);
    expect(health.failed).toBe(-1);
    expect(health.exhaustedQueued).toBe(-1);
  });
});
