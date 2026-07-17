import { getCurrentAuthState } from "@/lib/auth/session";
import { searchActiveInviteCandidates } from "@/lib/bookings/invitations/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await getCurrentAuthState();
  if (!auth.user || auth.profile?.status !== "active") {
    return Response.json({ message: "Authentication required." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const search = params.get("q") ?? "";
  const excludeUserId = params.get("excludeUserId") ?? auth.user.id;
  try {
    const candidates = await searchActiveInviteCandidates(
      createAdminClient(), excludeUserId, search,
    );
    return Response.json({ candidates });
  } catch (error) {
    console.error("Initial invitation candidate search failed", error);
    return Response.json({ message: "Staff search is temporarily unavailable." }, { status: 500 });
  }
}
