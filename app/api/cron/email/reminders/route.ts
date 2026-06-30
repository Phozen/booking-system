import { NextResponse } from "next/server";

import { queueDueBookingReminders } from "@/lib/email/reminders";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request, cronSecret: string) {
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json(
      { errors: ["Cron processing is not configured."] },
      { status: 500 },
    );
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json(
      { errors: ["Unauthorized."] },
      { status: 401 },
    );
  }

  try {
    const result = await queueDueBookingReminders();

    return NextResponse.json({
      queued: result.queued,
      skipped: result.skipped,
      errors: [],
    });
  } catch (error) {
    console.error("Cron booking reminder queueing failed", error);

    return NextResponse.json(
      { errors: ["Booking reminders could not be queued."] },
      { status: 500 },
    );
  }
}
