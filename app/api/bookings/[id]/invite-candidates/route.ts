import { getCurrentAuthState } from "@/lib/auth/session";
import { searchInviteCandidatesForBooking } from "@/lib/bookings/invitations/queries";
import { invitationBookingIdSchema } from "@/lib/bookings/invitations/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await getCurrentAuthState();

  if (!authState.user || authState.profile?.status !== "active") {
    return Response.json({ message: "Authentication required." }, { status: 401 });
  }

  const parsedBookingId = invitationBookingIdSchema.safeParse((await params).id);

  if (!parsedBookingId.success) {
    return Response.json({ message: "Booking not found." }, { status: 404 });
  }

  const search = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (search.length < 2) {
    return Response.json({ candidates: [] });
  }

  try {
    const candidates = await searchInviteCandidatesForBooking(
      createAdminClient(),
      parsedBookingId.data,
      authState.user.id,
      search,
    );

    if (!candidates) {
      return Response.json({ message: "Booking not found." }, { status: 404 });
    }

    return Response.json({ candidates });
  } catch (error) {
    console.error("Invitation candidate search failed", {
      bookingId: parsedBookingId.data,
      userId: authState.user.id,
      error,
    });

    return Response.json(
      { message: "Staff search is temporarily unavailable." },
      { status: 500 },
    );
  }
}
