"use client";

import { useActionState } from "react";
import { ImagePlus } from "lucide-react";

import {
  facilityPhotoActionInitialState,
  uploadFacilityPhotoAction,
} from "@/lib/admin/facilities/photo-actions";
import { facilityPhotoMaxBytes } from "@/lib/admin/facilities/photo-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";

const maxSizeMb = Math.floor(facilityPhotoMaxBytes / 1024 / 1024);

export function FacilityPhotoUploadForm({
  facilityId,
}: {
  facilityId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    uploadFacilityPhotoAction,
    facilityPhotoActionInitialState,
  );
  const hasError = state.status === "error";

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="facilityId" value={facilityId} />

      {state.status !== "idle" ? (
        <Alert variant={hasError ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <Label htmlFor="facility-photo-upload">Photo</Label>
          <Input
            id="facility-photo-upload"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={getFieldDescribedBy(
              "facility-photo-upload-helper",
              hasError && "facility-photo-upload-error",
            )}
            aria-invalid={hasError}
            required
          />
          <FormFieldHelper id="facility-photo-upload-helper">
            Upload JPEG, PNG, or WebP images up to {maxSizeMb} MB.
          </FormFieldHelper>
          <FormFieldError id="facility-photo-upload-error">
            {hasError ? state.message : undefined}
          </FormFieldError>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="facility-photo-alt-text">Alt text</Label>
          <Input
            id="facility-photo-alt-text"
            name="altText"
            maxLength={160}
            placeholder="Example: Boardroom with screen and table"
            aria-describedby="facility-photo-alt-text-helper"
          />
          <FormFieldHelper id="facility-photo-alt-text-helper">
            Optional but recommended. Describe what the image shows.
          </FormFieldHelper>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          <ImagePlus data-icon="inline-start" />
          {isPending ? "Uploading..." : "Upload photo"}
        </Button>
      </div>
    </form>
  );
}

