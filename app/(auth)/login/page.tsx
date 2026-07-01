import { LogIn } from "lucide-react";

import { loginWithMicrosoftAction } from "@/lib/auth/actions";
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
import { Button } from "@/components/ui/button";

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

  if (searchParams.error === "microsoft") {
    return "Microsoft login was cancelled or denied. Try again, or use email and password.";
  }

  if (searchParams.error === "callback") {
    return "Microsoft login could not be completed. Check Supabase and Microsoft redirect settings.";
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
          Access room bookings, approvals, and your upcoming schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={loginWithMicrosoftAction}>
          <Button type="submit" variant="outline" size="lg" className="w-full">
            <LogIn aria-hidden="true" />
            Continue with Microsoft
          </Button>
        </form>
        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <LoginForm initialMessage={getLoginMessage(params, settings)} />
      </CardContent>
    </Card>
  );
}
