import type { ReactNode } from "react";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/guards";
import {
  getUnseenAppNotificationCount,
  getUserAppNotifications,
} from "@/lib/notifications/app-notifications";
import { getMissingProfileFields } from "@/lib/profile/completion";
import { getAppSettings } from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { UnseenApprovalToasts } from "@/components/notifications/unseen-approval-toasts";
import { ProfileCompletionPrompt } from "@/components/profile/profile-completion-prompt";
import { SkipLink } from "@/components/shared/skip-link";

export const dynamic = "force-dynamic";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireUser();
  const settings = await getAppSettings();
  const profileCompletion = getMissingProfileFields(profile);

  return (
    <div className="qbook-office-surface flex min-h-svh flex-col">
      <SkipLink />
      <Suspense
        fallback={
          <AppHeader
            appName={settings.appName}
            email={user.email}
            role={profile.role}
          />
        }
      >
        <EmployeeHeader
          appName={settings.appName}
          email={user.email}
          role={profile.role}
          userId={user.id}
        />
      </Suspense>
      {!profileCompletion.isComplete ? (
        <ProfileCompletionPrompt
          missingFields={profileCompletion.missingFields}
          storageKey={`profile-completion-prompt:${user.id}`}
          profileHref="/profile"
        />
      ) : null}
      <div id="main-content" tabIndex={-1} className="qbook-content-card flex-1">
        {children}
      </div>
    </div>
  );
}

async function EmployeeHeader({
  appName,
  email,
  role,
  userId,
}: {
  appName: string;
  email?: string | null;
  role?: string | null;
  userId: string;
}) {
  const supabase = await createClient();
  const [notifications, unseenNotificationCount] = await Promise.all([
    getUserAppNotifications(supabase, userId),
    getUnseenAppNotificationCount(supabase, userId),
  ]);

  return (
    <>
      <AppHeader
        appName={appName}
        email={email}
        role={role}
        notifications={notifications}
        unseenNotificationCount={unseenNotificationCount}
      />
      <UnseenApprovalToasts notifications={notifications} />
    </>
  );
}
