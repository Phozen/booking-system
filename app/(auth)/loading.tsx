import { LoginPanel } from "@/components/auth/login-panel";
import { defaultAppSettings } from "@/lib/settings/queries";

export default function AuthLoading() {
  return <LoginPanel contactEmail={defaultAppSettings.systemContactEmail} />;
}
