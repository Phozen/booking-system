import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";
import { getMyInvitations } from "@/lib/bookings/invitations/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitationsPageList } from "@/components/bookings/invitations/invitations-page-list";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  if (!INTERNAL_INVITES_ENABLED) {
    redirect("/dashboard");
  }

  const { user } = await requireUser();
  const supabase = createAdminClient();
  const invitations = await getMyInvitations(supabase, user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Inbox"
        title="Invites"
        description="Meetings where you were added as an attendee."
        secondaryAction={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/calendar"
              className={buttonVariants({ variant: "outline" })}
            >
              <CalendarDays data-icon="inline-start" />
              View calendar
            </Link>
            <Link
              href="/my-bookings"
              className={buttonVariants({ variant: "ghost" })}
            >
              My bookings
            </Link>
          </div>
        }
      />

      <InvitationsPageList invitations={invitations} />
    </main>
  );
}
