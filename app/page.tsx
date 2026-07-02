import { getAppSettings } from "@/lib/settings/queries";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  getLoginMessage,
  LoginPanel,
  type LoginSearchParams,
} from "@/components/auth/login-panel";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<LoginSearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const settings = await getAppSettings();

  return (
    <AuthShell appName={settings.appName} companyName={settings.companyName}>
      <LoginPanel initialMessage={getLoginMessage(params, settings)} />
    </AuthShell>
  );
}
