"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";

import {
  createFacilityAction,
  updateFacilityAction,
} from "@/lib/facilities/actions";
import type { FacilityActionResult } from "@/lib/facilities/action-types";
import {
  facilityFormSchema,
  facilityTypeOptions,
  type FacilityType,
} from "@/lib/facilities/validation";
import {
  formatFacilityType,
} from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { OverlayLoader } from "@/components/shared/overlay-loader";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { showFormValidationError } from "@/components/shared/form-validation-toast";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

function requiresApprovalValue(value: boolean | null) {
  if (value === true) {
    return "required";
  }

  if (value === false) {
    return "not_required";
  }

  return "inherit";
}

type FacilityFieldId =
  | "code"
  | "name"
  | "slug"
  | "level"
  | "type"
  | "capacity"
  | "description"
  | "status"
  | "requiresApproval";

type FacilityFieldErrors = Partial<Record<FacilityFieldId, string>>;

function getFirstError(error?: string[]) {
  return error?.[0];
}

function formDataToFacilityValues(formData: FormData) {
  const getValue = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  return {
    code: getValue("code"),
    name: getValue("name"),
    slug: getValue("slug"),
    level: getValue("level"),
    type: getValue("type"),
    capacity: getValue("capacity"),
    description: getValue("description"),
    status: getValue("status"),
    requiresApproval: getValue("requiresApproval"),
  };
}

export function FacilityForm({ facility }: { facility?: Facility }) {
  const router = useRouter();
  const [result, setResult] = useState<FacilityActionResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FacilityFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = facilityFormSchema.safeParse(
      formDataToFacilityValues(formData),
    );

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const nextErrors = {
        code: getFirstError(errors.code),
        name: getFirstError(errors.name),
        slug: getFirstError(errors.slug),
        level: getFirstError(errors.level),
        type: getFirstError(errors.type),
        capacity: getFirstError(errors.capacity),
        description: getFirstError(errors.description),
        status: getFirstError(errors.status),
        requiresApproval: getFirstError(errors.requiresApproval),
      };
      setFieldErrors(nextErrors);
      showFormValidationError(nextErrors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const actionResult = facility
        ? await updateFacilityAction(facility.id, formData)
        : await createFacilityAction(formData);

      setResult(actionResult);

      if (actionResult.status === "success") {
        router.refresh();

        if (!facility && actionResult.facilityId) {
          router.push(`/admin/facilities/${actionResult.facilityId}`);
        }
      }
    });
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={onSubmit}>
      {result ? (
        <Alert variant={result.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}
      <OverlayLoader show={isPending} label="Saving facility..." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={facility?.code ?? ""}
            aria-describedby={getFieldDescribedBy(
              "code-helper",
              fieldErrors.code && "code-error",
            )}
            aria-invalid={Boolean(fieldErrors.code)}
            required
          />
          <FormFieldHelper id="code-helper">
            Short internal code, for example MR-L5-01.
          </FormFieldHelper>
          <FormFieldError id="code-error">{fieldErrors.code}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={facility?.name ?? ""}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.name && "name-error",
            )}
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
          <FormFieldError id="name-error">{fieldErrors.name}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={facility?.slug ?? ""}
            aria-describedby={getFieldDescribedBy(
              "slug-helper",
              fieldErrors.slug && "slug-error",
            )}
            aria-invalid={Boolean(fieldErrors.slug)}
            required
          />
          <FormFieldHelper id="slug-helper">
            Lowercase letters, numbers, and hyphens only.
          </FormFieldHelper>
          <FormFieldError id="slug-error">{fieldErrors.slug}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            name="level"
            defaultValue={facility?.level ?? ""}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.level && "level-error",
            )}
            aria-invalid={Boolean(fieldErrors.level)}
            required
          />
          <FormFieldError id="level-error">{fieldErrors.level}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            name="type"
            defaultValue={facility?.type ?? "meeting_room"}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.type && "type-error",
            )}
            aria-invalid={Boolean(fieldErrors.type)}
          >
            {facilityTypeOptions.map((type) => (
              <option key={type} value={type}>
                {formatFacilityType(type as FacilityType)}
              </option>
            ))}
          </Select>
          <FormFieldError id="type-error">{fieldErrors.type}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={facility?.capacity ?? 8}
            aria-describedby={getFieldDescribedBy(
              "capacity-helper",
              fieldErrors.capacity && "capacity-error",
            )}
            aria-invalid={Boolean(fieldErrors.capacity)}
            required
          />
          <FormFieldHelper id="capacity-helper">
            Maximum number of attendees allowed for bookings.
          </FormFieldHelper>
          <FormFieldError id="capacity-error">
            {fieldErrors.capacity}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Booking visibility</Label>
          <Select
            id="status"
            name="status"
            defaultValue={facility?.status ?? "active"}
            aria-describedby={getFieldDescribedBy(
              "status-helper",
              fieldErrors.status && "status-error",
            )}
            aria-invalid={Boolean(fieldErrors.status)}
          >
            <option value="active">Available for booking</option>
            <option value="inactive">Unavailable indefinitely</option>
            {facility?.status === "under_maintenance" ? (
              <option value="under_maintenance">
                Under Maintenance (legacy)
              </option>
            ) : null}
            {facility?.status === "archived" ? (
              <option value="archived">Archived</option>
            ) : null}
          </Select>
          <FormFieldHelper id="status-helper">
            Use indefinite unavailability only when this facility has no return date. For temporary closures or maintenance, use{" "}
            <Link href="/admin/unavailability" className="font-medium text-foreground underline underline-offset-4">
              Facility unavailability
            </Link>.
          </FormFieldHelper>
          <FormFieldError id="status-error">{fieldErrors.status}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="requiresApproval">Requires approval</Label>
          <Select
            id="requiresApproval"
            name="requiresApproval"
            defaultValue={requiresApprovalValue(facility?.requiresApproval ?? null)}
            aria-describedby={getFieldDescribedBy(
              "requiresApproval-helper",
              fieldErrors.requiresApproval && "requiresApproval-error",
            )}
            aria-invalid={Boolean(fieldErrors.requiresApproval)}
          >
            <option value="inherit">Use system default</option>
            <option value="required">Required</option>
            <option value="not_required">Not required</option>
          </Select>
          <FormFieldHelper id="requiresApproval-helper">
            Use system default unless this room needs different approval behavior.
          </FormFieldHelper>
          <FormFieldError id="requiresApproval-error">
            {fieldErrors.requiresApproval}
          </FormFieldError>
        </div>

      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={facility?.description ?? ""}
          rows={5}
          aria-describedby={getFieldDescribedBy(
            "description-helper",
            fieldErrors.description && "description-error",
          )}
          aria-invalid={Boolean(fieldErrors.description)}
          className="min-h-28"
        />
        <FormFieldHelper id="description-helper">
          Optional. Describe the space, layout, or booking guidance.
        </FormFieldHelper>
        <FormFieldError id="description-error">
          {fieldErrors.description}
        </FormFieldError>
      </div>

      <div className="grid gap-3 border-t pt-5 sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/facilities")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            {facility ? "Save facility" : "Create facility"}
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
