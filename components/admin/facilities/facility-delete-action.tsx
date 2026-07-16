"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

import { deleteFacilityFormAction } from "@/lib/facilities/actions";
import type { FacilityActionResult } from "@/lib/facilities/action-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";

const initialState: FacilityActionResult = {
  status: "idle",
  message: "",
};

export function FacilityDeleteAction({
  facilityId,
  facilityName,
}: {
  facilityId: string;
  facilityName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    deleteFacilityFormAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/admin/facilities");
    }
  }, [router, state.status]);

  return (
    <section className="grid gap-4 rounded-lg border border-destructive/35 bg-rose-50/60 p-5 text-rose-950 shadow-sm shadow-rose-500/10 ring-1 ring-rose-200/60 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100">
      <ActionToastEffect
        state={state}
        successTitle="Facility deleted"
        errorTitle="Facility delete failed"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-normal">
            <Trash2 className="size-5" aria-hidden="true" />
            Permanent deletion
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-800 dark:text-rose-200">
            Permanently delete this facility. This is only recommended for facilities that were created by mistake. This action cannot be undone. Facilities with associated bookings cannot be deleted.
          </p>
        </div>
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="facilityId" value={facilityId} />
          <ConfirmDialog
            triggerLabel="Delete facility"
            title="Permanently delete this facility?"
            description={
              <>
                <span className="font-medium">{facilityName}</span> will be
                permanently deleted. This action cannot be undone.
              </>
            }
            confirmLabel="Delete facility"
            cancelLabel="Keep facility"
            pendingLabel="Deleting..."
            destructive
            pending={isPending}
            onConfirm={() => formRef.current?.requestSubmit()}
          />
        </form>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "success" ? "success" : "destructive"}>
          <AlertTitle>
            {state.status === "success" ? "Facility deleted" : "Delete failed"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
