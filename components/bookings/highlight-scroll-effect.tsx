"use client";

import { useEffect } from "react";

export function HighlightScrollEffect({ highlight }: { highlight?: string }) {
  useEffect(() => {
    if (!highlight) {
      return;
    }

    const element = document.getElementById(`booking-${highlight}`);
    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [highlight]);

  return null;
}
