import { ShieldCheck } from "lucide-react";

import { loginWithMicrosoftAction } from "@/lib/auth/actions";
import {
  formatAccountInactiveMessage,
  type AppSettings,
} from "@/lib/settings/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmailLoginDisclosure } from "@/components/auth/email-login-disclosure";
import { MicrosoftLogo } from "@/components/auth/microsoft-logo";
import { productName } from "@/components/shared/company-logo";
import { Button } from "@/components/ui/button";

export type LoginSearchParams = Record<string, string | string[] | undefined>;

export function getLoginMessage(
  searchParams: LoginSearchParams,
  settings: Pick<AppSettings, "systemContactEmail">,
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

export function LoginPanel({
  initialMessage,
}: {
  initialMessage?: string;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-xl shadow-primary/10 backdrop-blur">
      <CardHeader className="gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex size-11 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="grid gap-1">
          <CardTitle className="text-2xl font-semibold tracking-normal">
            Sign in to {productName}
          </CardTitle>
          <CardDescription>
            Continue with your company account to manage bookings and schedules.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6">
        <form action={loginWithMicrosoftAction}>
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            <MicrosoftLogo className="size-5" />
            Continue with Microsoft
          </Button>
        </form>
        <EmailLoginDisclosure initialMessage={initialMessage} />
      </CardContent>
    </Card>
  );
}
