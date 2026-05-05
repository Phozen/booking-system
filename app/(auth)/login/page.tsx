import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getLoginMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.auth === "required") {
    return "Log in to continue.";
  }

  if (searchParams.error === "disabled") {
    return "Your account is disabled. Contact an administrator.";
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Use your company email and password to access bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm initialMessage={getLoginMessage(params)} />
      </CardContent>
    </Card>
  );
}
