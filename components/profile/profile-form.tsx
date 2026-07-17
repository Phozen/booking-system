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
import { showFormValidationError } from "@/components/shared/form-validation-toast";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";

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
      const nextErrors = {
        fullName: getFirstError(errors.fullName),
        department: getFirstError(errors.department),
        phone: getFirstError(errors.phone),
      };
      setFieldErrors(nextErrors);
      showFormValidationError(nextErrors);
      event.preventDefault();
      return;
    }

    setFieldErrors({});
  }

  return (
    <form
      action={formAction}
      className="grid gap-5 rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
      noValidate
      onSubmit={validateBeforeSubmit}
    >
      <ActionToastEffect
        state={state}
        successTitle="Profile saved"
        errorTitle="Profile not saved"
      />
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Edit profile
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Update contact details used in bookings and reports.
        </p>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <FieldRequirementBadge required />
          </div>
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
          <FormFieldHelper id="fullName-helper">Used in booking details and reports.</FormFieldHelper>
          <FormFieldError id="fullName-error">
            {fieldErrors.fullName}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="department">Department</Label>
            <FieldRequirementBadge required={false} />
          </div>
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
          <FormFieldHelper id="department-helper">Shown on your profile and in booking reports.</FormFieldHelper>
          <FormFieldError id="department-error">
            {fieldErrors.department}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="phone">Phone</Label>
            <FieldRequirementBadge required={false} />
          </div>
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
          <FormFieldHelper id="phone-helper">Used only when booking staff need to contact you.</FormFieldHelper>
          <FormFieldError id="phone-error">{fieldErrors.phone}</FormFieldError>
        </div>
      </div>

      <div className="grid border-t pt-5 sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            <Save data-icon="inline-start" />
            Save profile
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
