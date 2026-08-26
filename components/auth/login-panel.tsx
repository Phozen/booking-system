import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

import { loginWithMicrosoftAction } from "@/lib/auth/actions";
import {
  LoginErrorAlert,
  LoginNextField,
} from "@/components/auth/login-search-state";
import { MicrosoftLogo } from "@/components/auth/microsoft-logo";
import { productName } from "@/components/shared/company-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export {
  getLoginMessage,
  type LoginSearchParams,
} from "@/components/auth/login-message";

export function LoginPanel({ contactEmail }: { contactEmail: string }) {
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
          <Suspense fallback={null}>
            <LoginNextField />
          </Suspense>
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            <MicrosoftLogo className="size-5" />
            Continue with Microsoft
          </Button>
        </form>
        <Suspense fallback={null}>
          <LoginErrorAlert contactEmail={contactEmail} />
        </Suspense>
        <p className="text-sm text-muted-foreground">
          Access is limited to active employees with an authorized company
          Microsoft email. Email and password registration is disabled.
        </p>
      </CardContent>
    </Card>
  );
}
