"use client";

import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  pendingLabel = "Working...",
  destructive,
  disabled,
  pending,
  onConfirm,
  triggerClassName,
}: {
  triggerLabel: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
  triggerClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [internalPending, setInternalPending] = useState(false);
  const isPending = pending || internalPending;
  const Icon = destructive ? AlertTriangle : CheckCircle2;

  function closeDialog() {
    dialogRef.current?.close();
    triggerRef.current?.focus();
  }

  async function handleConfirm() {
    if (disabled || isPending) {
      return;
    }

    setInternalPending(true);

    try {
      await onConfirm();
      closeDialog();
    } finally {
      setInternalPending(false);
    }
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant={destructive ? "destructive" : "outline"}
        className={triggerClassName}
        disabled={disabled || isPending}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90dvh] w-[min(92vw,30rem)] overflow-y-auto rounded-lg border border-border/70 bg-card p-0 text-foreground shadow-xl ring-1 ring-primary/15 backdrop:bg-slate-950/45"
      >
        <div className="grid gap-4 p-5">
          <div className="flex gap-3">
            <div
              className={
                destructive
                  ? "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                  : "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/25"
              }
            >
              <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-normal"
              >
                {title}
              </h2>
              <div
                id={descriptionId}
                className="mt-2 text-sm leading-6 text-muted-foreground"
              >
                {description}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isPending}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={disabled || isPending}
            >
              {isPending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
