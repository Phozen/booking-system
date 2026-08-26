import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  getMicrosoftCalendarSyncConfig,
  isDelegatedBookingOwnerCalendarSyncReady,
} from "@/lib/integrations/microsoft-365-calendar/config";
import { getOwnMicrosoftCalendarConnectionStatus } from "@/lib/integrations/microsoft-365-calendar/delegated";
import { getUserNotificationPreferences } from "@/lib/notifications/preferences";
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
import { MicrosoftCalendarConnectionCard } from "@/components/profile/microsoft-calendar-connection-card";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string | string[] }>;
}) {
  const { user } = await requireUser();
  const supabase = await createClient();
  const [params, profile, settings, notificationPreferences, calendarConnection] =
    await Promise.all([
      searchParams,
      getOwnProfile(supabase, user.id),
      getAppSettings(),
      getUserNotificationPreferences(supabase, user.id),
      getOwnMicrosoftCalendarConnectionStatus(user.id),
    ]);
  const calendar = params.calendar;
  const calendarMessage =
    calendar === "connected" ||
    calendar === "error" ||
    calendar === "unavailable"
      ? calendar
      : undefined;
  const calendarSyncReady = isDelegatedBookingOwnerCalendarSyncReady(
    getMicrosoftCalendarSyncConfig(),
  );

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow="Account"
          title="Your account profile is not ready"
          description="Contact an administrator."
        />
        <ErrorState
          title="Your account profile is not ready. Contact an administrator."
          description={formatContactAdministratorMessage(settings)}
          action={
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Go to dashboard
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Your details"
        description="Keep your name and contact info up to date so coworkers and admins can reach you."
      />

      <ProfileDetail profile={profile} />

      {!profileCompletion.isComplete ? (
        <ProfileMissingFieldsCallout
          missingFields={profileCompletion.missingFields}
        />
      ) : null}

      <ProfileForm profile={profile} profileArea="employee" />

      <section
        className="grid gap-4 border-t border-border pt-8"
        aria-labelledby="profile-integrations-heading"
      >
        <div>
          <h2 id="profile-integrations-heading" className="qbook-type-section">
            Integrations
          </h2>
          <p className="qbook-type-meta mt-1">
            Optional connections that sync bookings to your calendar.
          </p>
        </div>
        <MicrosoftCalendarConnectionCard
          connection={calendarConnection}
          calendarMessage={calendarMessage}
          calendarSyncReady={calendarSyncReady}
        />
      </section>

      <section
        className="grid gap-4 border-t border-border pt-8"
        aria-labelledby="profile-notifications-heading"
      >
        <div>
          <h2
            id="profile-notifications-heading"
            className="qbook-type-section"
          >
            Notification preferences
          </h2>
          <p className="qbook-type-meta mt-1">
            Choose which non-critical booking notifications you want to receive.
          </p>
        </div>
        <NotificationPreferencesForm preferences={notificationPreferences} />
      </section>

      <Alert variant="info">
        <LockKeyhole className="size-4" aria-hidden="true" />
        <AlertDescription>
          Email, role, and account status are managed separately for
          security. {formatContactAdministratorMessage(settings)}
        </AlertDescription>
      </Alert>
    </main>
  );
}
