export type FlashToastKey =
  | "settings-saved"
  | "profile-saved"
  | "preferences-saved";

export type FlashToastPayload = {
  type: "success" | "error" | "info";
  title: string;
  description: string;
};

const flashToasts: Record<FlashToastKey, FlashToastPayload> = {
  "settings-saved": {
    type: "success",
    title: "Settings saved",
    description:
      "System settings saved. Future bookings will use the updated settings.",
  },
  "profile-saved": {
    type: "success",
    title: "Profile saved",
    description: "Your contact details are now saved.",
  },
  "preferences-saved": {
    type: "success",
    title: "Preferences saved",
    description: "Your notification preferences have been updated.",
  },
};

export function getFlashToast(key: string | null | undefined): FlashToastPayload | null {
  if (!key) {
    return null;
  }

  return flashToasts[key as FlashToastKey] ?? null;
}

export function withFlashToast(path: string, key: FlashToastKey) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}toast=${key}`;
}
