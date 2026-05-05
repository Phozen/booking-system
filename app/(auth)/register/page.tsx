import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRegistrationSettings } from "@/lib/settings/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const registrationSettings = await getRegistrationSettings();

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
        {registrationSettings.registrationEnabled ? (
          <RegisterForm
            allowedEmailDomains={registrationSettings.allowedEmailDomains}
          />
        ) : (
          <Alert>
            <AlertDescription>
              Registration is currently disabled. Contact an administrator for
              access.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
