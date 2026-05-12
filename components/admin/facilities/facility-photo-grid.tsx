"use client";

import { useActionState, useRef } from "react";
import { CheckCircle2, ImageIcon, Star } from "lucide-react";

import {
  deleteFacilityPhotoAction,
  setFacilityPhotoPrimaryAction,
} from "@/lib/admin/facilities/photo-actions";
import { facilityPhotoActionInitialState } from "@/lib/admin/facilities/photo-action-state";
import type { Facility, FacilityPhoto } from "@/lib/facilities/queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function FacilityPhotoPreview({
  facility,
  photo,
}: {
  facility: Facility;
  photo: FacilityPhoto;
}) {
  if (photo.publicUrl) {
    return (
      <div
        role="img"
        aria-label={photo.altText ?? `${facility.name} photo`}
        className="h-full w-full object-cover"
        style={{
          backgroundImage: `url(${photo.publicUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${facility.name} photo unavailable`}
      className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
    >
      <ImageIcon className="size-8" aria-hidden="true" />
    </div>
  );
}

function FacilityPhotoCard({
  facility,
  photo,
}: {
  facility: Facility;
  photo: FacilityPhoto;
}) {
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const [primaryState, primaryAction, primaryPending] = useActionState(
    setFacilityPhotoPrimaryAction,
    facilityPhotoActionInitialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteFacilityPhotoAction,
    facilityPhotoActionInitialState,
  );
  const result =
    deleteState.status !== "idle"
      ? deleteState
      : primaryState.status !== "idle"
        ? primaryState
        : null;

  return (
    <article className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm ring-1 ring-primary/5">
      <div className="relative aspect-[4/3] bg-muted">
        <FacilityPhotoPreview facility={facility} photo={photo} />
        {photo.isPrimary ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Primary
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 p-4">
        <div>
          <h3 className="text-sm font-semibold tracking-normal">
            {photo.altText || "Facility photo"}
          </h3>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {photo.storagePath}
          </p>
        </div>

        {result ? (
          <Alert
            variant={result.status === "error" ? "destructive" : "success"}
          >
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <form action={primaryAction}>
            <input type="hidden" name="facilityId" value={facility.id} />
            <input type="hidden" name="photoId" value={photo.id} />
            <Button
              type="submit"
              variant={photo.isPrimary ? "secondary" : "outline"}
              disabled={photo.isPrimary || primaryPending || deletePending}
              className={cn("w-full", photo.isPrimary && "justify-center")}
            >
              <Star data-icon="inline-start" />
              {primaryPending
                ? "Updating..."
                : photo.isPrimary
                  ? "Primary photo"
                  : "Set primary"}
            </Button>
          </form>

          <form action={deleteAction} ref={deleteFormRef}>
            <input type="hidden" name="facilityId" value={facility.id} />
            <input type="hidden" name="photoId" value={photo.id} />
            <ConfirmDialog
              triggerLabel="Delete photo"
              title="Delete this facility photo?"
              description="This removes the photo from the facility and deletes the stored image object. Employee facility pages will stop showing it."
              confirmLabel="Delete photo"
              cancelLabel="Keep photo"
              pendingLabel="Deleting..."
              destructive
              pending={deletePending}
              disabled={primaryPending}
              triggerClassName="w-full"
              onConfirm={() => deleteFormRef.current?.requestSubmit()}
            />
          </form>
        </div>
      </div>
    </article>
  );
}

export function FacilityPhotoGrid({ facility }: { facility: Facility }) {
  if (facility.photos.length === 0) {
    return (
      <EmptyState
        title="No facility photos yet"
        description="Upload a photo to make this facility easier for employees to recognize."
        icon={<ImageIcon className="size-5" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {facility.photos.map((photo) => (
        <FacilityPhotoCard key={photo.id} facility={facility} photo={photo} />
      ))}
    </div>
  );
}
