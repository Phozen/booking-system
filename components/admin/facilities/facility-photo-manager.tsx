import { ImageIcon } from "lucide-react";

import type { Facility } from "@/lib/facilities/queries";
import { FacilityPhotoGrid } from "@/components/admin/facilities/facility-photo-grid";
import { FacilityPhotoUploadForm } from "@/components/admin/facilities/facility-photo-upload-form";

export function FacilityPhotoManager({ facility }: { facility: Facility }) {
  return (
    <section className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm ring-1 ring-primary/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/90">
            <ImageIcon className="size-3.5" aria-hidden="true" />
            Facility photos
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-normal">
            Manage employee-facing photos
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Photos are stored in the private Supabase Storage bucket and shown
            to active users with signed URLs. The primary photo appears first on
            employee facility pages.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {facility.photos.length} {facility.photos.length === 1 ? "photo" : "photos"}
        </div>
      </div>

      <div className="rounded-lg border bg-background/70 p-4">
        <FacilityPhotoUploadForm facilityId={facility.id} />
      </div>

      <FacilityPhotoGrid facility={facility} />
    </section>
  );
}

