import { Circle, UserRound } from "lucide-react";

import type { MissingProfileField } from "@/lib/profile/completion";

export function ProfileMissingFieldsCallout({
  missingFields,
}: {
  missingFields: MissingProfileField[];
}) {
  if (missingFields.length === 0) {
    return null;
  }

  const formattedFields =
    missingFields.length === 1
      ? missingFields[0]
      : `${missingFields.slice(0, -1).join(", ")} and ${missingFields.at(-1)}`;

  return (
    <aside
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm ring-1 ring-amber-200/60 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-50 dark:ring-amber-500/20"
      role="status"
      aria-live="polite"
      aria-labelledby="profile-missing-fields-heading"
    >
      <div className="flex min-w-0 gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
          <UserRound className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2
            id="profile-missing-fields-heading"
            className="text-sm font-semibold tracking-normal"
          >
            Complete your contact details
          </h2>
          <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">
            Add {formattedFields} below so booking requests and contact details
            are easier for the team to verify.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
            {missingFields.map((field) => (
              <li
                key={field}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white/70 px-2 py-1 text-amber-900 dark:border-amber-500/40 dark:bg-background/30 dark:text-amber-50"
              >
                <Circle className="size-3.5" aria-hidden="true" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
