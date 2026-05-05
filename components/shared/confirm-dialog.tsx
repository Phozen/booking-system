"use client";

import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";

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
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [internalPending, setInternalPending] = useState(false);
  const isPending = pending || internalPending;

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
        disabled={disabled || isPending}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-[min(92vw,28rem)] rounded-lg border border-border/70 bg-card p-0 text-foreground shadow-xl backdrop:bg-slate-950/35"
      >
        <div className="grid gap-4 p-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-normal">
              {title}
            </h2>
            <div
              id={descriptionId}
              className="mt-2 text-sm leading-6 text-muted-foreground"
            >
              {description}
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
