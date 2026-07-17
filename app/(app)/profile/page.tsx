import { LockKeyhole } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getUserNotificationPreferences } from "@/lib/notifications/preferences";
import { getOwnProfile } from "@/lib/profile/queries";
import {
  formatContactAdministratorMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileDetail } from "@/components/profile/profile-detail";
import { ProfileForm } from "@/components/profile/profile-form";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const [profile, settings, notificationPreferences] = await Promise.all([
    getOwnProfile(supabase, user.id),
    getAppSettings(),
    getUserNotificationPreferences(supabase, user.id),
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
        description="View your account details and update contact fields."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <ProfileDetail profile={profile} />
        <div className="grid gap-6">
          <ProfileForm profile={profile} />
          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold tracking-normal">
                Notification preferences
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Choose which non-critical booking notifications you want to
                receive.
              </p>
            </div>
            <NotificationPreferencesForm preferences={notificationPreferences} />
          </section>
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
