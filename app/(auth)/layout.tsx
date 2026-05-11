import type { ReactNode } from "react";

import { getAppSettings } from "@/lib/settings/queries";
import { AuthShell } from "@/components/auth/auth-shell";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const settings = await getAppSettings();

  return (
    <AuthShell appName={settings.appName} companyName={settings.companyName}>
      {children}
    </AuthShell>
  );
}
