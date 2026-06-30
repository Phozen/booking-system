import { NextResponse } from "next/server";

import { processQueuedEmailNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";

const defaultLimit = 25;
const maxLimit = 100;

function getBoundedLimit(request: Request) {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? defaultLimit);

  if (!Number.isFinite(rawLimit)) {
    return defaultLimit;
  }

  return Math.min(maxLimit, Math.max(1, Math.trunc(rawLimit)));
}

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
    const limit = getBoundedLimit(request);
    const result = await processQueuedEmailNotifications(limit);

    return NextResponse.json({
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      retried: result.retried,
      skipped: result.skipped,
      errors: [],
    });
  } catch (error) {
    console.error("Cron email queue processing failed", error);

    return NextResponse.json(
      { errors: ["Email queue processing failed."] },
      { status: 500 },
    );
  }
}
