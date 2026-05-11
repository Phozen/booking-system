import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminFacilityById } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { FacilityForm } from "@/components/admin/facilities/facility-form";
import { FacilityPhotoManager } from "@/components/admin/facilities/facility-photo-manager";
import { PageHeader } from "@/components/shared/page-header";
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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title={`Edit ${facility.name}`}
        description={`${facility.code} - Manage facility details, booking behavior, and employee-facing photos.`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Facilities", href: "/admin/facilities" },
          { label: facility.name },
        ]}
        secondaryAction={
          <Link
            href="/admin/facilities"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Facilities
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <FacilityForm facility={facility} />
      </section>

      <FacilityPhotoManager facility={facility} />
    </main>
  );
}
