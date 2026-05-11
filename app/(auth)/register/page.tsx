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
          Register with your company email. Access is controlled by system
          settings.
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
