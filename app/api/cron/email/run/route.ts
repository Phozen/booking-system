import { NextResponse } from "next/server";

import { processQueuedEmailNotifications } from "@/lib/email";
import { getEmailQueueHealth } from "@/lib/email/health";
import { queueDueBookingReminders } from "@/lib/email/reminders";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request, cronSecret: string) {
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, errors: ["Cron processing is not configured."] },
      { status: 500 },
    );
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json(
      { ok: false, errors: ["Unauthorized."] },
      { status: 401 },
    );
  }

  try {
    const reminders = await queueDueBookingReminders();
    const processing = await processQueuedEmailNotifications(100);
    const health = await getEmailQueueHealth();

    if (!health.healthy) {
      console.warn("Email queue requires operator attention", health);
    }

    return NextResponse.json(
      {
        ok: health.healthy,
        reminders,
        processing,
        health,
        errors: health.healthy
          ? []
          : ["Email queue requires operator recovery."],
      },
      { status: health.healthy ? 200 : 503 },
    );
  } catch (error) {
    console.error("Automated email cycle failed", error);
    return NextResponse.json(
      { ok: false, errors: ["Automated email cycle failed."] },
      { status: 500 },
    );
  }
}
