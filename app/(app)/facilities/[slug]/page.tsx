import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getEmployeeFacilityBySlug } from "@/lib/facilities/queries";
import { createClient } from "@/lib/supabase/server";
import { FacilityDetail } from "@/components/facilities/facility-detail";

export const dynamic = "force-dynamic";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const supabase = await createClient();
  const facility = await getEmployeeFacilityBySlug(supabase, slug);

  if (!facility) {
    notFound();
  }

  return <FacilityDetail facility={facility} />;
}
