import { requireUser } from "@/lib/auth/guards";
import { getMyInvitations } from "@/lib/bookings/invitations/queries";
import { createClient } from "@/lib/supabase/server";
import { InvitationsPageList } from "@/components/bookings/invitations/invitations-page-list";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const invitations = await getMyInvitations(supabase, user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Collaboration"
        title="Invitations"
        description="Review meetings you have been invited to and respond to pending invitations."
      />

      <InvitationsPageList invitations={invitations} />
    </main>
  );
}
