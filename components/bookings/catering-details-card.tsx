import { Coffee } from "lucide-react";

import type { BookingCateringDetails } from "@/lib/bookings/catering/format";
import {
  formatCateringServingTime,
  formatCateringType,
} from "@/lib/bookings/catering/format";
import { Alert, AlertDescription } from "@/components/ui/alert";

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 break-words font-medium">{value}</dd>
    </div>
  );
}

export function CateringDetailsCard({
  catering,
}: {
  catering: BookingCateringDetails;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <Coffee className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            Food & drinks / catering
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Refreshment details for this booking.
          </p>
        </div>
      </div>

      {!catering.required ? (
        <Alert className="mt-5">
          <AlertDescription>
            No catering or food/drinks requested.
          </AlertDescription>
        </Alert>
      ) : (
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem
            label="Request type"
            value={formatCateringType(catering.type)}
          />
          <DetailItem label="Number of pax" value={catering.pax ?? "Not specified"} />
          <DetailItem
            label="Serving time"
            value={formatCateringServingTime(catering.servingTime)}
          />
          <DetailItem
            label="Dietary / special notes"
            value={catering.dietaryNotes || "None"}
          />
          <div className="sm:col-span-2">
            <DetailItem
              label="Additional catering notes"
              value={catering.notes || "None"}
            />
          </div>
        </dl>
      )}
    </section>
  );
}
