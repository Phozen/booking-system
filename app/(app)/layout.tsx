import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/guards";
import { getAppSettings } from "@/lib/settings/queries";
import { AppHeader } from "@/components/app/app-header";

export const dynamic = "force-dynamic";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireUser();
  const settings = await getAppSettings();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader
        appName={settings.appName}
        email={user.email}
        role={profile.role}
      />
      {children}
    </div>
  );
}
