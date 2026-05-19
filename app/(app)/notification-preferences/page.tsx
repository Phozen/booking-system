import { requireUser } from "@/lib/auth/guards";
import { getUserNotificationPreferences } from "@/lib/notifications/preferences";
import { createClient } from "@/lib/supabase/server";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function NotificationPreferencesPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const preferences = await getUserNotificationPreferences(supabase, user.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Notification preferences"
        description="Choose which non-critical booking notifications you want to receive."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notification preferences" },
        ]}
      />

      <section className="rounded-lg border bg-card p-5">
        <NotificationPreferencesForm preferences={preferences} />
      </section>
    </main>
  );
}
