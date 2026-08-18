import Link from "next/link";
import { ArrowRight, CalendarPlus, Users } from "lucide-react";

import { formatFacilityType } from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import { employeeCopy } from "@/lib/employee/plain-language";
import { FacilityPhoto } from "@/components/facilities/facility-photo";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function EquipmentSummary({ facility }: { facility: Facility }) {
  if (facility.equipment.length === 0) {
    return "No equipment listed";
  }

  return facility.equipment
    .slice(0, 3)
    .map((item) => item.name)
    .join(", ");
}

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <article className="group qbook-elevate grid overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground hover:border-primary/40 sm:grid-cols-[180px_1fr]">
      <div className="aspect-[16/10] overflow-hidden bg-muted sm:aspect-auto">
        <FacilityPhoto
          facility={facility}
          className="transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {facility.code} · {facility.level}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-normal sm:text-xl">
              {facility.name}
            </h2>
          </div>
          <StatusBadge kind="facility" status={facility.status} />
        </div>

        <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Room type</dt>
            <dd>{formatFacilityType(facility.type)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Size</dt>
            <dd className="inline-flex items-center gap-1 font-medium text-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              {employeeCopy.fitsPeople(facility.capacity)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Equipment</dt>
            <dd className="break-words">
              <EquipmentSummary facility={facility} />
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href={`/bookings/new?facilityId=${facility.id}`}
            className={buttonVariants({
              size: "lg",
              className: "w-full min-h-11 sm:w-fit",
            })}
          >
            <CalendarPlus data-icon="inline-start" />
            {employeeCopy.bookThisRoom}
          </Link>
          <Link
            href={`/facilities/${facility.slug}`}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full min-h-11 sm:w-fit",
            })}
          >
            See details
            <ArrowRight
              data-icon="inline-end"
              className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
