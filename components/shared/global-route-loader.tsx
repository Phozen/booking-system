"use client";

import { useEffect, useState } from "react";
import { useLoadingStore } from "@/lib/store/use-loading-store";
import { RouteLoading } from "./route-loading";
import { cn } from "@/lib/utils";

export function GlobalRouteLoader() {
  const { isLoading, label, variant } = useLoadingStore();
  const [render, setRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setRender(true);
      setIsFadingOut(false);
    } else {
      setIsFadingOut(true);
      const timeout = setTimeout(() => {
        setRender(false);
        setIsFadingOut(false);
      }, 500); // Wait for the fade-out duration
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!render) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] bg-background fill-mode-both duration-500",
        isFadingOut ? "animate-out fade-out" : "animate-in fade-in"
      )}
    >
      <RouteLoading label={label} variant={variant} />
    </div>
  );
}

export function RouteLoadingTrigger({
  label,
  variant,
}: {
  label?: string;
  variant?: "cards" | "table" | "form";
}) {
  const setLoading = useLoadingStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true, { label, variant });
    return () => {
      setLoading(false);
    };
  }, [setLoading, label, variant]);

  return null;
}
