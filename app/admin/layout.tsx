import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAppSettings } from "@/lib/settings/queries";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdmin();
  const settings = await getAppSettings();

  return (
    <AdminShell
      appName={settings.appName}
      email={user.email}
      role={profile.role}
    >
      {children}
    </AdminShell>
  );
}
