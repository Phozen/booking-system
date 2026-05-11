import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatAccountInactiveMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getLoginMessage(
  searchParams: Record<string, string | string[] | undefined>,
  settings: Awaited<ReturnType<typeof getAppSettings>>,
) {
  if (searchParams.auth === "required") {
    return "Log in to continue.";
  }

  if (searchParams.error === "disabled") {
    return formatAccountInactiveMessage(settings);
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const settings = await getAppSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Use your company email and password to access bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm initialMessage={getLoginMessage(params, settings)} />
      </CardContent>
    </Card>
  );
}
