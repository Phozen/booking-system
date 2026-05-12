"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Archive } from "lucide-react";

import {
  archiveFacilityFormAction,
  type FacilityActionResult,
} from "@/lib/facilities/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const initialState: FacilityActionResult = {
  status: "idle",
  message: "",
};

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
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    archiveFacilityFormAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/admin/facilities");
    }
  }, [router, state.status]);

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
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="facilityId" value={facilityId} />
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
            pending={isPending}
            onConfirm={() => formRef.current?.requestSubmit()}
          />
        </form>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "success" ? "success" : "destructive"}>
          <AlertTitle>
            {state.status === "success" ? "Facility archived" : "Archive failed"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
