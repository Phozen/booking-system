import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  formatFacilityType,
  formatRequiresApproval,
} from "@/lib/facilities/format";
import type { Facility } from "@/lib/facilities/queries";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FacilityPhoto } from "@/components/facilities/facility-photo";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

export function FacilityDetail({ facility }: { facility: Facility }) {
  const canBook = facility.status === "active" && !facility.isArchived;
  const approvalCopy =
    facility.requiresApproval === true
      ? "Bookings for this facility require admin approval."
      : facility.requiresApproval === false
        ? "Bookings for this facility are confirmed automatically when available."
        : "Approval follows the current system setting.";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-3">
        <Breadcrumbs
          items={[
            { label: "Facilities", href: "/facilities" },
            { label: facility.name },
          ]}
        />
        <Link
          href="/facilities"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Facilities
        </Link>
      </div>

      <header className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="aspect-[16/9] bg-muted">
            <FacilityPhoto facility={facility} priority />
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-lg border bg-card p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {facility.code} - {facility.level}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              {facility.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You can choose the date and time on the next step.
            </p>
          </div>

          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{formatFacilityType(facility.type)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Capacity</dt>
              <dd className="inline-flex items-center gap-2 font-medium">
                <Users className="size-4" aria-hidden="true" />
                {facility.capacity}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium">
                <StatusBadge kind="facility" status={facility.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Approval</dt>
              <dd className="inline-flex items-center gap-2 font-medium">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {formatRequiresApproval(facility.requiresApproval)}
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">{approvalCopy}</p>
            </div>
          </dl>

          {canBook ? (
            <Link
              href={`/bookings/new?facilityId=${facility.id}`}
              className={buttonVariants({
                className: "mt-auto w-full",
              })}
            >
              <CalendarPlus data-icon="inline-start" />
              Book this facility
            </Link>
          ) : (
            <div className="mt-auto rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
              This facility is not available for booking right now.
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">Details</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {facility.description || "No description has been added yet."}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">Equipment</h2>
          {facility.equipment.length > 0 ? (
            <ul className="mt-4 grid gap-3 text-sm">
              {facility.equipment.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    {item.name}
                    {item.quantity > 1 ? ` x ${item.quantity}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Equipment has not been listed for this facility.
            </p>
          )}
        </div>
      </section>

      {facility.photos.length > 1 ? (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">Photos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facility.photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
              >
                {photo.publicUrl ? (
                  <div
                    role="img"
                    aria-label={photo.altText ?? `${facility.name} photo`}
                    className="h-full w-full"
                    style={{
                      backgroundImage: `url(${photo.publicUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  />
                ) : (
                  <FacilityPhoto facility={{ ...facility, photos: [photo] }} />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
