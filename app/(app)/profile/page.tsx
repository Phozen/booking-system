import { LockKeyhole } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  getMicrosoftCalendarSyncConfig,
  isDelegatedBookingOwnerCalendarSyncReady,
} from "@/lib/integrations/microsoft-365-calendar/config";
import { getOwnMicrosoftCalendarConnectionStatus } from "@/lib/integrations/microsoft-365-calendar/delegated";
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
import { MicrosoftCalendarConnectionCard } from "@/components/profile/microsoft-calendar-connection-card";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
          title="Profile unavailable"
          description={`Your account profile could not be loaded. ${formatContactAdministratorMessage(settings)}`}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Update your contact details. Integrations and notifications are below."
      />

      <ProfileDetail profile={profile} />
      <ProfileForm profile={profile} />

      <section className="grid gap-4 border-t border-border pt-8">
        <div>
          <h2 className="qbook-type-section">Integrations</h2>
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

      <section className="grid gap-4 border-t border-border pt-8">
        <div>
          <h2 className="qbook-type-section">Notification preferences</h2>
          <p className="qbook-type-meta mt-1">
            Choose which non-critical booking notifications you want to receive.
          </p>
        </div>
        <NotificationPreferencesForm preferences={notificationPreferences} />
      </section>

      <Alert variant="info">
        <LockKeyhole className="size-4" aria-hidden="true" />
        <AlertDescription>
          Email, password, role, and account status are managed separately for
          security. {formatContactAdministratorMessage(settings)}
        </AlertDescription>
      </Alert>
    </main>
  );
}
