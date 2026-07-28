import { getSafeInternalPath } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/settings/queries";
import {
  getLoginMessage,
  LoginPanel,
  type LoginSearchParams,
} from "@/components/auth/login-panel";

type LoginPageProps = {
  searchParams: Promise<LoginSearchParams>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const settings = await getAppSettings();

  const next = getSafeInternalPath(
    typeof params.next === "string" ? params.next : null,
  );

  return <LoginPanel initialMessage={getLoginMessage(params, settings)} next={next ?? undefined} />;
}
