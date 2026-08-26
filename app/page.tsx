import { AuthShell } from "@/components/auth/auth-shell";
import { LoginPanel } from "@/components/auth/login-panel";
import { getAppSettings } from "@/lib/settings/queries";

export default async function Home() {
  const settings = await getAppSettings();

  return (
    <AuthShell appName={settings.appName} companyName={settings.companyName}>
      <LoginPanel contactEmail={settings.systemContactEmail} />
    </AuthShell>
  );
}
