import { requireAdmin } from "@/lib/auth/guards";
import { getAdminEmailNotifications } from "@/lib/admin/email-notifications/queries";
import { createClient } from "@/lib/supabase/server";
import { EmailNotificationsTable } from "@/components/admin/email-notifications/email-notifications-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminEmailNotificationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const notifications = await getAdminEmailNotifications(supabase);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Email notifications"
      />

      <EmailNotificationsTable notifications={notifications} />
    </main>
  );
}
