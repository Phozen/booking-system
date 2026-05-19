import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/guards";
import { getMissingProfileFields } from "@/lib/profile/completion";
import { getAppSettings } from "@/lib/settings/queries";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProfileCompletionPrompt } from "@/components/profile/profile-completion-prompt";
import { SkipLink } from "@/components/shared/skip-link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdmin();
  const settings = await getAppSettings();
  const profileCompletion = getMissingProfileFields(profile);

  return (
    <AdminShell
      appName={settings.appName}
      email={user.email}
      role={profile.role}
    >
      <SkipLink />
      {!profileCompletion.isComplete ? (
        <ProfileCompletionPrompt
          missingFields={profileCompletion.missingFields}
          storageKey={`profile-completion-prompt:${user.id}`}
          profileHref="/admin/profile"
        />
      ) : null}
      <div id="main-content" tabIndex={-1} className="contents">
        {children}
      </div>
    </AdminShell>
  );
}
