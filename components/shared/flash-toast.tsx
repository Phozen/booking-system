"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StaticToastEffect } from "@/components/shared/static-toast-effect";
import { getFlashToast } from "@/lib/ui/flash-toasts";

/**
 * Shows a Sonner toast from ?toast=... then strips the query so refresh
 * does not repeat it.
 */
export function FlashToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cleared = useRef(false);
  const key = searchParams.get("toast");
  const payload = getFlashToast(key);

  useEffect(() => {
    if (!key || !payload || cleared.current) {
      return;
    }

    cleared.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [key, payload, pathname, router, searchParams]);

  if (!payload) {
    return null;
  }

  return (
    <StaticToastEffect
      type={payload.type}
      title={payload.title}
      description={payload.description}
    />
  );
}
