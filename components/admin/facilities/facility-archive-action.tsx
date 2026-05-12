"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive } from "lucide-react";

import {
  archiveFacilityAction,
  type FacilityActionResult,
} from "@/lib/facilities/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function FacilityArchiveAction({
  facilityId,
  facilityName,
  isArchived,
}: {
  facilityId: string;
  facilityName: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [result, setResult] = useState<FacilityActionResult | null>(null);

  return (
    <section className="grid gap-4 rounded-lg border border-destructive/35 bg-rose-50/60 p-5 text-rose-950 shadow-sm shadow-rose-500/10 ring-1 ring-rose-200/60 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-normal">
            <Archive className="size-5" aria-hidden="true" />
            Danger zone
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-800 dark:text-rose-200">
            Archive this facility when it should no longer be bookable. This
            removes it from employee booking pages while preserving historical
            bookings, reports, photos, and audit logs.
          </p>
        </div>
        <ConfirmDialog
          triggerLabel={isArchived ? "Facility archived" : "Archive facility"}
          title="Archive this facility?"
          description={
            <>
              <span className="font-medium">{facilityName}</span> will be
              hidden from employee booking pages and cannot be used for new
              bookings. Historical records will remain available.
            </>
          }
          confirmLabel="Archive facility"
          cancelLabel="Keep facility"
          pendingLabel="Archiving..."
          destructive
          disabled={isArchived}
          onConfirm={async () => {
            const nextResult = await archiveFacilityAction(facilityId);
            setResult(nextResult);

            if (nextResult.status === "success") {
              router.refresh();
            }
          }}
        />
      </div>

      {result ? (
        <Alert variant={result.status === "success" ? "success" : "destructive"}>
          <AlertTitle>
            {result.status === "success" ? "Facility archived" : "Archive failed"}
          </AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
