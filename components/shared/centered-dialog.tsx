"use client";

import {
  type DialogHTMLAttributes,
  type Ref,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { centeredDialogClassName } from "@/components/shared/dialog-styles";
import { cn } from "@/lib/utils";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CenteredDialog({
  className,
  ref,
  ...props
}: DialogHTMLAttributes<HTMLDialogElement> & {
  ref?: Ref<HTMLDialogElement>;
}) {
  const mounted = useIsClient();

  if (!mounted) {
    return null;
  }

  return createPortal(
    <dialog
      {...props}
      ref={ref}
      className={cn(centeredDialogClassName, className)}
    />,
    document.body,
  );
}
