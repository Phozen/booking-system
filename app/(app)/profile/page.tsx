import { LockKeyhole } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getOwnProfile } from "@/lib/profile/queries";
import {
  formatContactAdministratorMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileDetail } from "@/components/profile/profile-detail";
import { ProfileForm } from "@/components/profile/profile-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const [profile, settings] = await Promise.all([
    getOwnProfile(supabase, user.id),
    getAppSettings(),
  ]);

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow="Account"
          title="Profile unavailable"
          description={`Your account profile could not be loaded. ${formatContactAdministratorMessage(settings)}`}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="View your account details and update safe contact fields used across the booking system."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ProfileDetail profile={profile} />
        <div className="grid gap-6">
          <ProfileForm profile={profile} />
          <Alert variant="info">
            <LockKeyhole className="size-4" aria-hidden="true" />
            <AlertDescription>
              Email, password, role, and account status are managed separately
              for security. {formatContactAdministratorMessage(settings)}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </main>
  );
}
