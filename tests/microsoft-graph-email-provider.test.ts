import { describe, expect, it, vi } from "vitest";

import { getMicrosoftGraphEmailConfig } from "@/lib/email/microsoft-graph-config";
import { createMicrosoftGraphEmailProvider } from "@/lib/email/providers/microsoft-graph";

vi.mock("server-only", () => ({}));

describe("Microsoft Graph email provider", () => {
  it("reports only missing environment variable names", () => {
    const config = getMicrosoftGraphEmailConfig({
      EMAIL_MICROSOFT_TENANT_ID: "tenant",
      EMAIL_MICROSOFT_CLIENT_SECRET: "super-secret-value",
    });

    expect(config.isConfigured).toBe(false);
    expect(config.missingKeys).toEqual([
      "EMAIL_MICROSOFT_CLIENT_ID",
      "EMAIL_MICROSOFT_SENDER",
    ]);
    expect(config.validationError).not.toContain("super-secret-value");
  });

  it("sends the rendered email through the configured sender mailbox", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createMicrosoftGraphEmailProvider(
      getMicrosoftGraphEmailConfig({
        EMAIL_MICROSOFT_TENANT_ID: "tenant-id",
        EMAIL_MICROSOFT_CLIENT_ID: "client-id",
        EMAIL_MICROSOFT_CLIENT_SECRET: "super-secret-value",
        EMAIL_MICROSOFT_SENDER: "booking-notices@example.com",
      }),
    );
    const result = await provider.send({
      from: "Booking System <booking-notices@example.com>",
      to: "staff@example.com",
      subject: "Booking approved",
      html: "<p>Your booking is approved.</p>",
      text: "Your booking is approved.",
    });

    expect(result).toEqual({
      ok: true,
      provider: "microsoft_graph",
      messageId: null,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://graph.microsoft.com/v1.0/users/booking-notices%40example.com/sendMail",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      message: {
        subject: "Booking approved",
        body: {
          contentType: "HTML",
          content: "<p>Your booking is approved.</p>",
        },
        toRecipients: [{ emailAddress: { address: "staff@example.com" } }],
      },
      saveToSentItems: true,
    });
    vi.unstubAllGlobals();
  });
});
