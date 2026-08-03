import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { FacilityForm } from "@/components/admin/facilities/facility-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewFacilityPage() {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="New facility"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Facilities", href: "/admin/facilities" },
          { label: "New" },
        ]}
        secondaryAction={
          <Link
            href="/admin/facilities"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to facilities
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <FacilityForm />
      </section>
    </main>
  );
}
