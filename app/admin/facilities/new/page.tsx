import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { FacilityForm } from "@/components/admin/facilities/facility-form";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewFacilityPage() {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href="/admin/facilities"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Facilities
        </Link>
      </div>

      <header className="border-b pb-6">
        <p className="text-sm font-medium text-muted-foreground">
          Admin area
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">
          New facility
        </h1>
      </header>

      <section className="rounded-lg border bg-card p-5">
        <FacilityForm />
      </section>
    </main>
  );
}
