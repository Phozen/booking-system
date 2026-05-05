import Link from "next/link";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";

import {
  formatFacilityType,
  formatRequiresApproval,
} from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import { FacilityPhoto } from "@/components/facilities/facility-photo";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function EquipmentSummary({ facility }: { facility: Facility }) {
  if (facility.equipment.length === 0) {
    return "Equipment not listed";
  }

  return facility.equipment
    .slice(0, 3)
    .map((item) => item.name)
    .join(", ");
}

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/25 sm:grid-cols-[220px_1fr]">
      <div className="aspect-[4/3] bg-muted sm:aspect-auto">
        <FacilityPhoto facility={facility} />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {facility.code} - {facility.level}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal">
              {facility.name}
            </h2>
          </div>
          <StatusBadge kind="facility" status={facility.status} />
        </div>

        <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-medium text-foreground">Type</dt>
            <dd>{formatFacilityType(facility.type)}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Capacity</dt>
            <dd className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {facility.capacity}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Equipment</dt>
            <dd className="break-words">
              <EquipmentSummary facility={facility} />
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Approval</dt>
            <dd className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {formatRequiresApproval(facility.requiresApproval)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex justify-end">
          <Link
            href={`/facilities/${facility.slug}`}
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-fit",
            })}
          >
            View details
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </article>
  );
}
