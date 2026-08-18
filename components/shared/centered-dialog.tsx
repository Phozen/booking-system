"use client";

import {
  type DialogHTMLAttributes,
  type Ref,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { centeredDialogClassName } from "@/components/shared/dialog-styles";
import { cn } from "@/lib/utils";

export function CenteredDialog({
  className,
  ref,
  ...props
}: DialogHTMLAttributes<HTMLDialogElement> & {
  ref?: Ref<HTMLDialogElement>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
