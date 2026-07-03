import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/guards";
import { getMissingProfileFields } from "@/lib/profile/completion";
import { getAppSettings } from "@/lib/settings/queries";
import { AppHeader } from "@/components/app/app-header";
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
    <div className="qbook-office-surface flex min-h-svh flex-col bg-background">
      <SkipLink />
      <AppHeader
        appName={settings.appName}
        email={user.email}
        role={profile.role}
      />
      {!profileCompletion.isComplete ? (
        <ProfileCompletionPrompt
          missingFields={profileCompletion.missingFields}
          storageKey={`profile-completion-prompt:${user.id}`}
          profileHref="/profile"
        />
      ) : null}
      <div id="main-content" tabIndex={-1} className="qbook-content-card">
        {children}
      </div>
    </div>
  );
}
