import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getMissingProfileFields } from "@/lib/profile/completion";
import { getOwnProfile } from "@/lib/profile/queries";
import {
  formatContactAdministratorMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { ProfileDetail } from "@/components/profile/profile-detail";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileMissingFieldsCallout } from "@/components/profile/profile-missing-fields-callout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const [profile, settings] = await Promise.all([
    getOwnProfile(supabase, user.id),
    getAppSettings(),
  ]);

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow="Admin account"
          title="Your account profile is not ready"
          description="Contact an administrator."
          breadcrumbs={[
            { label: "Admin dashboard", href: "/admin/dashboard" },
            { label: "Profile" },
          ]}
        />
        <ErrorState
          title="Your account profile is not ready. Contact an administrator."
          description={formatContactAdministratorMessage(settings)}
          action={
            <Link
              href="/admin/dashboard"
              className={buttonVariants({ variant: "outline" })}
            >
              Go to admin dashboard
            </Link>
          }
        />
      </main>
    );
  }

  const profileCompletion = getMissingProfileFields({
    full_name: profile.fullName,
    department: profile.department,
    phone: profile.phone,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin account"
        title="Your profile"
        breadcrumbs={[
          { label: "Admin dashboard", href: "/admin/dashboard" },
          { label: "Profile" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ProfileDetail profile={profile} />
        <div className="grid gap-6">
          {!profileCompletion.isComplete ? (
            <ProfileMissingFieldsCallout
              missingFields={profileCompletion.missingFields}
            />
          ) : null}
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
