"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";

import {
  updateSystemSettingsAction,
  type SettingsActionResult,
} from "@/lib/admin/settings/actions";
import {
  formDataToSettingsValues,
  settingsFormSchema,
} from "@/lib/admin/settings/validation";
import type { AppSettings } from "@/lib/settings/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";

const initialState: SettingsActionResult = {
  status: "idle",
  message: "",
};

type SettingsFieldId =
  | "appName"
  | "companyName"
  | "systemContactEmail"
  | "allowedEmailDomains"
  | "defaultTimezone"
  | "reminderOffsetsMinutes";

type SettingsFieldErrors = Partial<Record<SettingsFieldId, string>>;

function getFirstError(error?: string[]) {
  return error?.[0];
}

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(
    updateSystemSettingsAction,
    initialState,
  );
  const [fieldErrors, setFieldErrors] = useState<SettingsFieldErrors>({});

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = settingsFormSchema.safeParse(
      formDataToSettingsValues(formData),
    );

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        appName: getFirstError(errors.appName),
        companyName: getFirstError(errors.companyName),
        systemContactEmail: getFirstError(errors.systemContactEmail),
        allowedEmailDomains: getFirstError(errors.allowedEmailDomainsText),
        defaultTimezone: getFirstError(errors.defaultTimezone),
        reminderOffsetsMinutes: getFirstError(
          errors.reminderOffsetsMinutesText,
        ),
      });
      event.preventDefault();
      return;
    }

    setFieldErrors({});
  }

  return (
    <form
      action={formAction}
      className="grid gap-6"
      noValidate
      onSubmit={validateBeforeSubmit}
    >
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-5 rounded-lg border bg-card p-5">
        <div>
          <h2 className="font-semibold tracking-normal">Identity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Names and contact details shown across the internal app.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="appName">App name</Label>
            <Input
              id="appName"
              name="appName"
              defaultValue={settings.appName}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.appName && "appName-error",
              )}
              aria-invalid={Boolean(fieldErrors.appName)}
              required
            />
            <FormFieldError id="appName-error">
              {fieldErrors.appName}
            </FormFieldError>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={settings.companyName}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.companyName && "companyName-error",
              )}
              aria-invalid={Boolean(fieldErrors.companyName)}
            />
            <FormFieldError id="companyName-error">
              {fieldErrors.companyName}
            </FormFieldError>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="systemContactEmail">System contact email</Label>
            <Input
              id="systemContactEmail"
              name="systemContactEmail"
              type="email"
              defaultValue={settings.systemContactEmail}
              placeholder="facilities@example.com"
              aria-describedby={getFieldDescribedBy(
                "systemContactEmail-helper",
                fieldErrors.systemContactEmail && "systemContactEmail-error",
              )}
              aria-invalid={Boolean(fieldErrors.systemContactEmail)}
            />
            <FormFieldHelper id="systemContactEmail-helper">
              Optional. Used for support contact messaging, not for provider
              secrets.
            </FormFieldHelper>
            <FormFieldError id="systemContactEmail-error">
              {fieldErrors.systemContactEmail}
            </FormFieldError>
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border bg-card p-5">
        <div>
          <h2 className="font-semibold tracking-normal">Registration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control employee self-registration and approved email domains.
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <input
            name="registrationEnabled"
            type="checkbox"
            defaultChecked={settings.registrationEnabled}
            className="size-4 rounded border-input"
          />
          <span>
            <span className="block font-medium">Allow employee registration</span>
            <span className="text-muted-foreground">
              Disabled registration blocks the register page and register action.
            </span>
          </span>
        </label>

        <div className="grid gap-2">
          <Label htmlFor="allowedEmailDomains">Allowed email domains</Label>
          <textarea
            id="allowedEmailDomains"
            name="allowedEmailDomains"
            defaultValue={settings.allowedEmailDomains.join(", ")}
            rows={3}
            placeholder="example.com, company.com"
            aria-describedby={getFieldDescribedBy(
              "allowedEmailDomains-helper",
              fieldErrors.allowedEmailDomains && "allowedEmailDomains-error",
            )}
            aria-invalid={Boolean(fieldErrors.allowedEmailDomains)}
            className="min-h-24 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <FormFieldHelper id="allowedEmailDomains-helper" className="text-xs">
            Leave empty to allow any valid email domain.
          </FormFieldHelper>
          <FormFieldError id="allowedEmailDomains-error">
            {fieldErrors.allowedEmailDomains}
          </FormFieldError>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border bg-card p-5">
        <div>
          <h2 className="font-semibold tracking-normal">Booking behavior</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure approval defaults and facility-level override behavior.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input
              name="defaultApprovalRequired"
              type="checkbox"
              defaultChecked={settings.defaultApprovalRequired}
              className="size-4 rounded border-input"
            />
            <span>
              <span className="block font-medium">
                Require approval by default
              </span>
              <span className="text-muted-foreground">
                New bookings become pending unless an allowed facility override
                says otherwise.
              </span>
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input
              name="allowFacilityApprovalOverride"
              type="checkbox"
              defaultChecked={settings.allowFacilityApprovalOverride}
              className="size-4 rounded border-input"
            />
            <span>
              <span className="block font-medium">
                Allow facility approval override
              </span>
              <span className="text-muted-foreground">
                Facility settings can override the global approval default.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border bg-card p-5">
        <div>
          <h2 className="font-semibold tracking-normal">Time and reminders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defaults used for display and future reminder scheduling.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="defaultTimezone">Default timezone</Label>
            <Input
              id="defaultTimezone"
              name="defaultTimezone"
              defaultValue={settings.defaultTimezone}
              aria-describedby={getFieldDescribedBy(
                "defaultTimezone-helper",
                fieldErrors.defaultTimezone && "defaultTimezone-error",
              )}
              aria-invalid={Boolean(fieldErrors.defaultTimezone)}
              required
            />
            <FormFieldHelper id="defaultTimezone-helper">
              Use an IANA timezone such as Asia/Kuala_Lumpur.
            </FormFieldHelper>
            <FormFieldError id="defaultTimezone-error">
              {fieldErrors.defaultTimezone}
            </FormFieldError>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reminderOffsetsMinutes">
              Reminder offsets minutes
            </Label>
            <Input
              id="reminderOffsetsMinutes"
              name="reminderOffsetsMinutes"
              defaultValue={settings.reminderOffsetsMinutes.join(", ")}
              aria-describedby={getFieldDescribedBy(
                "reminderOffsetsMinutes-helper",
                fieldErrors.reminderOffsetsMinutes &&
                  "reminderOffsetsMinutes-error",
              )}
              aria-invalid={Boolean(fieldErrors.reminderOffsetsMinutes)}
              required
            />
            <FormFieldHelper id="reminderOffsetsMinutes-helper" className="text-xs">
              Use positive integers such as 1440, 60.
            </FormFieldHelper>
            <FormFieldError id="reminderOffsetsMinutes-error">
              {fieldErrors.reminderOffsetsMinutes}
            </FormFieldError>
          </div>
        </div>
      </section>

      <div className="grid border-t pt-5 sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
