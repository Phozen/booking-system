import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilityById } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { FacilityForm } from "@/components/admin/facilities/facility-form";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const facility = await getAdminFacilityById(supabase, id);

  if (!facility) {
    notFound();
  }

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
          Edit {facility.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{facility.code}</p>
      </header>

      <section className="rounded-lg border bg-card p-5">
        <FacilityForm facility={facility} />
      </section>
    </main>
  );
}
