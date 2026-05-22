import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getFacilityAvailabilityTimeline } from "@/lib/facilities/availability-timeline";
import { getEmployeeFacilityBySlug } from "@/lib/facilities/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FacilityDetail } from "@/components/facilities/facility-detail";

export const dynamic = "force-dynamic";

export default async function FacilityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [facility, settings] = await Promise.all([
    getEmployeeFacilityBySlug(supabase, slug),
    getAppSettings(),
  ]);

  if (!facility) {
    notFound();
  }

  const selectedDate =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: settings.defaultTimezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
  const timeline = await getFacilityAvailabilityTimeline(createAdminClient(), {
    facilityId: facility.id,
    date: selectedDate,
    timezone: settings.defaultTimezone,
  });

  return (
    <FacilityDetail
      facility={facility}
      settings={settings}
      availabilityDate={selectedDate}
      availabilityTimeline={timeline}
    />
  );
}
