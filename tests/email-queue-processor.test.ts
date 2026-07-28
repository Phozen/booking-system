import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmailSendResult } from "@/lib/email/types";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  sendNotificationEmail: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/email/send", () => ({
  sendNotificationEmail: mocks.sendNotificationEmail,
}));

const { processQueuedEmailNotifications } = await import("@/lib/email/queue");

const queueSource = readFileSync(
  join(process.cwd(), "lib/email/queue.ts"),
  "utf8",
).replace(/\s+/g, " ");

const baseClaimedEmail = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "booking_confirmation",
  recipient_email: "user@example.com",
  recipient_name: null,
  subject: "Booking confirmed",
  body: "Body",
  template_data: { bookingId: "booking-1" },
  related_booking_id: null,
  provider: null,
  attempts: 1,
  max_attempts: 3,
};

function createSupabaseMock({
  claimed = [baseClaimedEmail],
  markSentError = null,
  markFailedError = null,
  inactiveRecipientIds = [],
  relatedBookings = [],
  invitationRows = [],
}: {
  claimed?: unknown[];
  markSentError?: { message: string } | null;
  markFailedError?: { message: string } | null;
  inactiveRecipientIds?: string[];
  relatedBookings?: unknown[];
  invitationRows?: unknown[];
} = {}) {
  const rpc = vi.fn(async (name: string, args?: { p_email_id?: string }) => {
    if (name === "claim_email_notifications") {
      return { data: claimed, error: null };
    }

    if (name === "mark_email_notification_sent") {
      return { data: { status: "sent" }, error: markSentError };
    }

    if (name === "mark_email_notification_failed") {
      return { data: { status: "queued" }, error: markFailedError };
    }

    if (name === "cancel_email_notification_for_inactive_recipient") {
      return {
        data: inactiveRecipientIds.includes(args?.p_email_id ?? ""),
        error: null,
      };
    }

    return { data: null, error: { message: `Unexpected RPC ${name}` } };
  });

  const bookingQuery = {
    select: vi.fn(),
    in: vi.fn(),
  };
  bookingQuery.select.mockReturnValue(bookingQuery);
  bookingQuery.in.mockResolvedValue({ data: relatedBookings, error: null });

  let invitationFilters = 0;
  const invitationQuery = {
    select: vi.fn(),
    in: vi.fn(),
  };
  invitationQuery.select.mockReturnValue(invitationQuery);
  invitationQuery.in.mockImplementation(() => {
    invitationFilters += 1;
    return invitationFilters === 3
      ? Promise.resolve({ data: invitationRows, error: null })
      : invitationQuery;
  });

  const from = vi.fn((table: string) =>
    table === "bookings" ? bookingQuery : invitationQuery,
  );

  return { rpc, from };
}

function okSend(messageId = "provider-message-1"): EmailSendResult {
  return {
    ok: true,
    provider: "smtp",
    messageId,
  };
}

function failedSend(error = "temporary timeout"): EmailSendResult {
  return {
    ok: false,
    provider: "smtp",
    error,
  };
}

describe("email queue processor", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue(createSupabaseMock());
    mocks.sendNotificationEmail.mockResolvedValue(okSend());
  });

  it("claims email notifications through the atomic RPC", async () => {
    const supabase = createSupabaseMock();

    await processQueuedEmailNotifications(supabase as never, 7);

    expect(supabase.rpc).toHaveBeenCalledWith("claim_email_notifications", {
      p_limit: 7,
      p_stale_after: "15 minutes",
    });
  });

  it("creates the service-role client when called with only a limit", async () => {
    const supabase = createSupabaseMock();
    mocks.createAdminClient.mockReturnValue(supabase);

    await processQueuedEmailNotifications(3);

    expect(mocks.createAdminClient).toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith("claim_email_notifications", {
      p_limit: 3,
      p_stale_after: "15 minutes",
    });
  });

  it("marks successful sends through mark_email_notification_sent with provider metadata", async () => {
    const supabase = createSupabaseMock();
    mocks.sendNotificationEmail.mockResolvedValue(okSend("smtp-123"));

    const result = await processQueuedEmailNotifications(supabase as never);

    expect(result.sent).toBe(1);
    expect(supabase.rpc).toHaveBeenCalledWith("mark_email_notification_sent", {
      p_email_id: baseClaimedEmail.id,
      p_provider: "smtp",
      p_provider_message_id: "smtp-123",
    });
  });

  it("marks failed sends for retry using deterministic backoff", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2035-01-01T00:00:00.000Z"));
    const supabase = createSupabaseMock();
    mocks.sendNotificationEmail.mockResolvedValue(failedSend("temporary timeout"));

    const result = await processQueuedEmailNotifications(supabase as never);

    expect(result.retried).toBe(1);
    expect(supabase.rpc).toHaveBeenCalledWith("mark_email_notification_failed", {
      p_email_id: baseClaimedEmail.id,
      p_error: "temporary timeout",
      p_retry_at: "2035-01-01T00:05:00.000Z",
    });
  });

  it("marks failed sends permanent when max attempts are reached", async () => {
    const exhausted = {
      ...baseClaimedEmail,
      attempts: 3,
      max_attempts: 3,
    };
    const supabase = createSupabaseMock({ claimed: [exhausted] });
    mocks.sendNotificationEmail.mockResolvedValue(failedSend("permanent failure"));

    const result = await processQueuedEmailNotifications(supabase as never);

    expect(result.failed).toBe(1);
    expect(supabase.rpc).toHaveBeenCalledWith("mark_email_notification_failed", {
      p_email_id: exhausted.id,
      p_error: "permanent failure",
      p_retry_at: null,
    });
  });

  it("cancels a claimed email before delivery when its recipient is disabled", async () => {
    const supabase = createSupabaseMock({
      inactiveRecipientIds: [baseClaimedEmail.id],
    });

    const result = await processQueuedEmailNotifications(supabase as never);

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mocks.sendNotificationEmail).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "cancel_email_notification_for_inactive_recipient",
      { p_email_id: baseClaimedEmail.id },
    );
  });

  it("continues processing a batch after one email fails", async () => {
    const second = {
      ...baseClaimedEmail,
      id: "22222222-2222-4222-8222-222222222222",
      recipient_email: "second@example.com",
    };
    const supabase = createSupabaseMock({
      claimed: [baseClaimedEmail, second],
    });
    mocks.sendNotificationEmail
      .mockResolvedValueOnce(failedSend())
      .mockResolvedValueOnce(okSend("smtp-456"));

    const result = await processQueuedEmailNotifications(supabase as never);

    expect(result.processed).toBe(2);
    expect(result.retried).toBe(1);
    expect(result.sent).toBe(1);
    expect(mocks.sendNotificationEmail).toHaveBeenCalledTimes(2);
  });

  it("adds the protected calendar resolver only for the booking owner or an active invitee", async () => {
    const ownerEmail = {
      ...baseClaimedEmail,
      related_booking_id: "booking-1",
      recipient_user_id: "owner-1",
      template_data: { bookingId: "booking-1", status: "confirmed" },
    };
    const unrelatedEmail = {
      ...ownerEmail,
      id: "22222222-2222-4222-8222-222222222222",
      recipient_user_id: "other-user",
    };
    const relatedBooking = {
      id: "booking-1",
      user_id: "owner-1",
      title: "Planning Session",
      status: "confirmed",
      starts_at: "2037-01-01T01:00:00.000Z",
      ends_at: "2037-01-01T02:00:00.000Z",
      facilities: null,
      booking_departments: [],
    };
    const supabase = createSupabaseMock({
      claimed: [ownerEmail, unrelatedEmail],
      relatedBookings: [relatedBooking],
    });

    await processQueuedEmailNotifications(supabase as never);

    expect(mocks.sendNotificationEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        templateData: expect.objectContaining({
          calendarEventPath: "/bookings/booking-1/calendar",
        }),
      }),
    );
    expect(mocks.sendNotificationEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        templateData: expect.objectContaining({ calendarEventPath: undefined }),
      }),
    );
  });

  it("fails the batch loudly when the sent marker RPC fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = createSupabaseMock({
      markSentError: { message: "marker failed" },
    });

    await expect(
      processQueuedEmailNotifications(supabase as never),
    ).rejects.toThrow(/delivery status could not be recorded/i);
    expect(consoleError).toHaveBeenCalledWith("Email queue sent marker failed", {
      notificationId: baseClaimedEmail.id,
      provider: "smtp",
      message: "marker failed",
    });
    consoleError.mockRestore();
  });

  it("keeps batch queue processing on the atomic claim RPC", () => {
    expect(queueSource).toContain('rpc("claim_email_notifications"');
    expect(queueSource).toContain("export async function processEmailNotificationNow");
  });
});
