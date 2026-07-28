import { NextResponse, type NextRequest } from "next/server";

import { getCurrentAuthState } from "@/lib/auth/session";
import { getAuthorizedCalendarEventUrl } from "@/lib/bookings/teams-meeting-status";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookingUrl = new URL(`/bookings/${id}`, request.url);

  if (!uuidPattern.test(id)) {
    return NextResponse.redirect(new URL("/my-bookings", request.url));
  }

  const authState = await getCurrentAuthState();
  if (!authState.user || !authState.profile || authState.profile.status !== "active") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("auth", "required");
    loginUrl.searchParams.set("next", `/bookings/${id}/calendar`);
    return NextResponse.redirect(loginUrl);
  }

  const calendarEventUrl = await getAuthorizedCalendarEventUrl({
    bookingId: id,
    viewerUserId: authState.user.id,
  });
  if (!calendarEventUrl) {
    bookingUrl.searchParams.set("calendar", "unavailable");
    return NextResponse.redirect(bookingUrl);
  }

  return NextResponse.redirect(new URL(calendarEventUrl));
}
