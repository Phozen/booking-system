"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/lib/store/use-loading-store";
import { RouteLoading } from "./route-loading";
import { cn } from "@/lib/utils";

export function GlobalRouteLoader() {
  const { isLoading, label, variant, setLoading } = useLoadingStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = `${pathname}?${searchParams.toString()}`;
  const previousPath = useRef(currentPath);
  const [render, setRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (previousPath.current === currentPath) {
      return;
    }

    previousPath.current = currentPath;

    if (!isLoading) {
      return;
    }

    const timeout = setTimeout(() => setLoading(false), 120);

    return () => clearTimeout(timeout);
  }, [currentPath, isLoading, setLoading]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (isLoading) {
      timers.push(
        setTimeout(() => {
          setRender(true);
          setIsFadingOut(false);
        }, 0),
      );
    } else {
      timers.push(setTimeout(() => setIsFadingOut(true), 0));
      timers.push(
        setTimeout(() => {
          setRender(false);
          setIsFadingOut(false);
        }, 500),
      );
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [isLoading]);

  if (!render) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-background/80 backdrop-blur-sm fill-mode-both duration-500",
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
