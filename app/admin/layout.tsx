import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/guards";
import {
  getUnseenAppNotificationCount,
  getUserAppNotifications,
} from "@/lib/notifications/app-notifications";
import { getMissingProfileFields } from "@/lib/profile/completion";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProfileCompletionPrompt } from "@/components/profile/profile-completion-prompt";
import { SkipLink } from "@/components/shared/skip-link";

export const dynamic = "force-dynamic";

const ADMIN_NOTIFICATION_TYPES = ["booking_approval_request"] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdmin();
  const supabase = await createClient();
  const [settings, notifications, unseenNotificationCount] = await Promise.all([
    getAppSettings(),
    getUserAppNotifications(supabase, user.id, [...ADMIN_NOTIFICATION_TYPES]),
    getUnseenAppNotificationCount(supabase, user.id, [
      ...ADMIN_NOTIFICATION_TYPES,
    ]),
  ]);
  const profileCompletion = getMissingProfileFields(profile);

  return (
    <AdminShell
      appName={settings.appName}
      email={user.email}
      role={profile.role}
      notifications={notifications}
      unseenNotificationCount={unseenNotificationCount}
    >
      <SkipLink />
      {!profileCompletion.isComplete ? (
        <ProfileCompletionPrompt
          missingFields={profileCompletion.missingFields}
          storageKey={`profile-completion-prompt:${user.id}`}
          profileHref="/admin/profile"
        />
      ) : null}
      <div id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        {children}
      </div>
    </AdminShell>
  );
}
