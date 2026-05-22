import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { getFacilityAvailabilityTimeline } from "@/lib/facilities/availability-timeline";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  await requireUser();
  const url = new URL(request.url);
  const facilityId = url.searchParams.get("facilityId") ?? "";
  const date = url.searchParams.get("date") ?? "";

  if (!uuidPattern.test(facilityId) || !datePattern.test(date)) {
    return NextResponse.json(
      { error: "Choose a facility and date to view availability." },
      { status: 400 },
    );
  }

  const [settings, supabase] = await Promise.all([getAppSettings(), createClient()]);
  const items = await getFacilityAvailabilityTimeline(supabase, {
    facilityId,
    date,
    timezone: settings.defaultTimezone,
  });

  return NextResponse.json({ items });
}
