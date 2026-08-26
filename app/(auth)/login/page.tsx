import { getAppSettings } from "@/lib/settings/queries";
import { LoginPanel } from "@/components/auth/login-panel";

export default async function LoginPage() {
  const settings = await getAppSettings();

  return <LoginPanel contactEmail={settings.systemContactEmail} />;
}
