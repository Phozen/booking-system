"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

import { useLoadingStore } from "@/lib/store/use-loading-store";

type RouteLoadingLinkProps = ComponentProps<typeof Link> & {
  loadingLabel?: string;
  loadingVariant?: "cards" | "table" | "form";
};

export function RouteLoadingLink({
  loadingLabel = "Loading...",
  loadingVariant = "form",
  onClick,
  target,
  ...props
}: RouteLoadingLinkProps) {
  const setLoading = useLoadingStore((state) => state.setLoading);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target
    ) {
      return;
    }

    setLoading(true, {
      label: loadingLabel,
      variant: loadingVariant,
    });
  }

  return <Link {...props} target={target} onClick={handleClick} />;
}
