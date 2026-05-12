"use client";

import { useActionState, useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";

import { updateOwnProfileAction } from "@/lib/profile/actions";
import { profileActionInitialState } from "@/lib/profile/action-state";
import type { UserProfile } from "@/lib/profile/queries";
import {
  formDataToProfileUpdateInput,
  profileUpdateSchema,
} from "@/lib/profile/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";

type ProfileFieldId = "fullName" | "department" | "phone";
type ProfileFieldErrors = Partial<Record<ProfileFieldId, string>>;

function getFirstError(error?: string[]) {
  return error?.[0];
}

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const [state, formAction, isPending] = useActionState(
    updateOwnProfileAction,
    profileActionInitialState,
  );
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = profileUpdateSchema.safeParse(
      formDataToProfileUpdateInput(formData),
    );

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: getFirstError(errors.fullName),
        department: getFirstError(errors.department),
        phone: getFirstError(errors.phone),
      });
      event.preventDefault();
      return;
    }

    setFieldErrors({});
  }

  return (
    <form
      action={formAction}
      className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm ring-1 ring-primary/5"
      noValidate
      onSubmit={validateBeforeSubmit}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Edit profile
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Update contact details that help colleagues and admins identify you in
          bookings and reports.
        </p>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile.fullName ?? ""}
            aria-describedby={getFieldDescribedBy(
              "fullName-helper",
              fieldErrors.fullName && "fullName-error",
            )}
            aria-invalid={Boolean(fieldErrors.fullName)}
            required
          />
          <FormFieldHelper id="fullName-helper">
            Required. This is shown in admin user and booking views.
          </FormFieldHelper>
          <FormFieldError id="fullName-error">
            {fieldErrors.fullName}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            defaultValue={profile.department ?? ""}
            aria-describedby={getFieldDescribedBy(
              "department-helper",
              fieldErrors.department && "department-error",
            )}
            aria-invalid={Boolean(fieldErrors.department)}
          />
          <FormFieldHelper id="department-helper">
            Optional. For example, Finance or Operations.
          </FormFieldHelper>
          <FormFieldError id="department-error">
            {fieldErrors.department}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={profile.phone ?? ""}
            aria-describedby={getFieldDescribedBy(
              "phone-helper",
              fieldErrors.phone && "phone-error",
            )}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          <FormFieldHelper id="phone-helper">
            Optional internal contact number.
          </FormFieldHelper>
          <FormFieldError id="phone-error">{fieldErrors.phone}</FormFieldError>
        </div>
      </div>

      <div className="grid border-t pt-5 sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Button type="submit" disabled={isPending}>
          <Save data-icon="inline-start" />
          {isPending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
