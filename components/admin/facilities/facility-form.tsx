"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";

import {
  createFacilityAction,
  updateFacilityAction,
  type FacilityActionResult,
} from "@/lib/facilities/actions";
import {
  facilityStatusOptions,
  facilityFormSchema,
  facilityTypeOptions,
  type FacilityStatus,
  type FacilityType,
} from "@/lib/facilities/validation";
import {
  formatFacilityStatus,
  formatFacilityType,
} from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";

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
  | "requiresApproval"
  | "displayOrder";

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
    displayOrder: getValue("displayOrder"),
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
      setFieldErrors({
        code: getFirstError(errors.code),
        name: getFirstError(errors.name),
        slug: getFirstError(errors.slug),
        level: getFirstError(errors.level),
        type: getFirstError(errors.type),
        capacity: getFirstError(errors.capacity),
        description: getFirstError(errors.description),
        status: getFirstError(errors.status),
        requiresApproval: getFirstError(errors.requiresApproval),
        displayOrder: getFirstError(errors.displayOrder),
      });
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
        <Alert variant={result.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

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
          <select
            id="type"
            name="type"
            defaultValue={facility?.type ?? "meeting_room"}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.type && "type-error",
            )}
            aria-invalid={Boolean(fieldErrors.type)}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {facilityTypeOptions.map((type) => (
              <option key={type} value={type}>
                {formatFacilityType(type as FacilityType)}
              </option>
            ))}
          </select>
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
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={facility?.status ?? "active"}
            aria-describedby={getFieldDescribedBy(
              fieldErrors.status && "status-error",
            )}
            aria-invalid={Boolean(fieldErrors.status)}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {facilityStatusOptions.map((status) => (
              <option key={status} value={status}>
                {formatFacilityStatus(status as FacilityStatus)}
              </option>
            ))}
          </select>
          <FormFieldError id="status-error">{fieldErrors.status}</FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="requiresApproval">Requires approval</Label>
          <select
            id="requiresApproval"
            name="requiresApproval"
            defaultValue={requiresApprovalValue(facility?.requiresApproval ?? null)}
            aria-describedby={getFieldDescribedBy(
              "requiresApproval-helper",
              fieldErrors.requiresApproval && "requiresApproval-error",
            )}
            aria-invalid={Boolean(fieldErrors.requiresApproval)}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="inherit">Use system default</option>
            <option value="required">Required</option>
            <option value="not_required">Not required</option>
          </select>
          <FormFieldHelper id="requiresApproval-helper">
            Use system default unless this room needs different approval behavior.
          </FormFieldHelper>
          <FormFieldError id="requiresApproval-error">
            {fieldErrors.requiresApproval}
          </FormFieldError>
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="displayOrder">Display order</Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min={0}
            defaultValue={facility?.displayOrder ?? 0}
            aria-describedby={getFieldDescribedBy(
              "displayOrder-helper",
              fieldErrors.displayOrder && "displayOrder-error",
            )}
            aria-invalid={Boolean(fieldErrors.displayOrder)}
            required
          />
          <FormFieldHelper id="displayOrder-helper">
            Lower numbers appear earlier in facility lists.
          </FormFieldHelper>
          <FormFieldError id="displayOrder-error">
            {fieldErrors.displayOrder}
          </FormFieldError>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={facility?.description ?? ""}
          rows={5}
          aria-describedby={getFieldDescribedBy(
            "description-helper",
            fieldErrors.description && "description-error",
          )}
          aria-invalid={Boolean(fieldErrors.description)}
          className="min-h-28 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          {isPending ? "Saving..." : facility ? "Save facility" : "Create facility"}
        </Button>
      </div>
    </form>
  );
}
