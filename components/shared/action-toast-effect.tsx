"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ToastState = {
  status?: string;
  message?: string;
};

export function ActionToastEffect({
  state,
  successTitle = "Saved",
  errorTitle = "Action failed",
}: {
  state: ToastState;
  successTitle?: string;
  errorTitle?: string;
}) {
  const previousKey = useRef("");

  useEffect(() => {
    if (!state.message || !state.status || state.status === "idle") {
      return;
    }

    const key = `${state.status}:${state.message}`;

    if (previousKey.current === key) {
      return;
    }

    previousKey.current = key;

    if (state.status === "success") {
      toast.success(successTitle, {
        description: state.message,
      });
      return;
    }

    if (state.status === "error") {
      toast.error(errorTitle, {
        description: state.message,
        duration: 8000,
      });
      return;
    }

    toast.info(state.message);
  }, [errorTitle, state.message, state.status, successTitle]);

  return null;
}
