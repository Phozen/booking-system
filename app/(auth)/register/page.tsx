import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRegistrationDisabledMessage,
  getAppSettings,
} from "@/lib/settings/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const settings = await getAppSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Request access with your company email. Admins can review accounts
          before booking access is active.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settings.registrationEnabled ? (
          <RegisterForm
            allowedEmailDomains={settings.allowedEmailDomains}
          />
        ) : (
          <Alert>
            <AlertDescription>
              {formatRegistrationDisabledMessage(settings)}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
