import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getEmployeeFacilityBySlug } from "@/lib/facilities/queries";
import { getAppSettings } from "@/lib/settings/queries";
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
  const [facility, settings] = await Promise.all([
    getEmployeeFacilityBySlug(supabase, slug),
    getAppSettings(),
  ]);

  if (!facility) {
    notFound();
  }

  return <FacilityDetail facility={facility} settings={settings} />;
}
