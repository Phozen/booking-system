import Link from "next/link";

import { ArrowRight, Building2, CalendarCheck, ShieldCheck } from "lucide-react";

import { appConfig, defaultFacilities } from "@/config/app";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-1 flex-col bg-background">
      <section className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="text-sm font-medium text-muted-foreground">
              Internal facilities
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-5xl">
              {appConfig.name}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Book meeting rooms and company facilities, review your schedule,
              and manage requests through a secure internal workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Login
              <ArrowRight />
            </Link>
            <Link
              href="/facilities"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              View facilities
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_2fr] lg:px-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="size-4" />
            Internal access
          </div>
          <h2 className="text-2xl font-semibold tracking-normal">
            Built for employees and facility administrators.
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {defaultFacilities.map((facility) => (
            <div
              key={facility.code}
              className="rounded-lg border bg-card p-4 text-card-foreground"
            >
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{facility.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {facility.level} - {facility.code}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <div className="flex items-start gap-3">
              <CalendarCheck className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Bookings and approvals</h3>
                <p className="text-sm text-muted-foreground">
                  Create booking requests, prevent time conflicts, and route
                  approvals when required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
