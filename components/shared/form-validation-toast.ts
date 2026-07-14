"use client";

import { toast } from "sonner";

export function showFormValidationError(
  errors: Record<string, string | null | undefined>,
  fallback = "Check the highlighted fields and try again.",
) {
  const messages = Array.from(
    new Set(
      Object.values(errors)
        .filter((message): message is string => Boolean(message?.trim()))
        .map((message) => message.trim()),
    ),
  );
  const visibleMessages = messages.slice(0, 3);
  const extraCount = messages.length - visibleMessages.length;
  const description =
    visibleMessages.length > 0
      ? `${visibleMessages.join(" ")}${extraCount > 0 ? ` ${extraCount} more field${extraCount === 1 ? "" : "s"} need attention.` : ""}`
      : fallback;

  toast.error("Submission error", {
    description,
    duration: 9000,
  });
}
