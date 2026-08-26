"use client";

import { useSearchParams } from "next/navigation";

import { getSafeInternalPath } from "@/lib/auth/safe-path";
import { getLoginMessage } from "@/components/auth/login-message";
import { Alert, AlertDescription } from "@/components/ui/alert";

function searchParamsRecord(
  searchParams: URLSearchParams,
): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

export function LoginNextField() {
  const searchParams = useSearchParams();
  const next = getSafeInternalPath(searchParams.get("next"));

  if (!next) {
    return null;
  }

  return <input type="hidden" name="next" value={next} />;
}

export function LoginErrorAlert({ contactEmail }: { contactEmail: string }) {
  const searchParams = useSearchParams();
  const message = getLoginMessage(searchParamsRecord(searchParams), {
    systemContactEmail: contactEmail,
  });

  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
