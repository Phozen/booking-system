import { Coffee } from "lucide-react";

import type { BookingCateringDetails } from "@/lib/bookings/catering/format";
import {
  formatCateringServingTime,
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
    <section className="grid gap-4 border-t border-border pt-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Coffee className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="qbook-type-section">
            Food & drinks / catering
          </h2>
          <p className="qbook-type-meta mt-1">
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
          <DetailItem label="Number of pax" value={catering.pax ?? "Not specified"} />
          <DetailItem
            label="Serving time"
            value={formatCateringServingTime(catering.servingTime)}
          />
          <DetailItem
            label="Dietary / special notes"
            value={catering.dietaryNotes || "None"}
          />
          {(() => {
            const notes = catering.notes || "";
            const drinksMatch = notes.match(/Drinks:\s*([^\n]+)/);
            const foodMatch = notes.match(/Food:\s*([^\n]+)/);
            
            let remainingNotes = notes;
            if (drinksMatch) remainingNotes = remainingNotes.replace(drinksMatch[0], "");
            if (foodMatch) remainingNotes = remainingNotes.replace(foodMatch[0], "");
            remainingNotes = remainingNotes.trim();

            return (
              <>
                {drinksMatch ? (
                  <DetailItem label="Drinks" value={drinksMatch[1]} />
                ) : null}
                {foodMatch ? (
                  <DetailItem label="Food" value={foodMatch[1]} />
                ) : null}
                <div className="sm:col-span-2">
                  <DetailItem
                    label="Additional catering notes"
                    value={remainingNotes || "None"}
                  />
                </div>
              </>
            );
          })()}
        </dl>
      )}
    </section>
  );
}
