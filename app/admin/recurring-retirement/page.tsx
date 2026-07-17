import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { retireRecurringBookingsAction } from "@/lib/admin/recurring-retirement/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function RecurringRetirementPage() {
  const { profile } = await requireSuperAdmin();
  if (profile?.status !== "active") redirect("/login?error=disabled");
  const { count } = await createAdminClient().from("bookings").select("id", { count: "exact", head: true }).not("recurrence_series_id", "is", null).gt("starts_at", new Date().toISOString()).in("status", ["pending", "confirmed"]);
  return <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader eyebrow="Super admin area" title="Retire recurring bookings" description="Permanently disables recurring-booking operations and cancels all future recurring occurrences." />
    <Alert variant="destructive"><AlertTitle>Irreversible operational change</AlertTitle><AlertDescription>{count ?? 0} future pending or confirmed recurring occurrence(s) will be cancelled. Historical records remain available for audit and reports; requesters, tagged departments, and Microsoft calendars are notified where applicable.</AlertDescription></Alert>
    <form action={retireRecurringBookingsAction} className="grid gap-5 rounded-lg border bg-card p-5"><label className="flex gap-3 text-sm"><input name="confirmRetirement" type="checkbox" value="yes" required /> I understand this cancels all future recurring bookings and cannot be undone.</label><Button variant="destructive">Retire and cancel future recurring bookings</Button></form>
  </main>;
}
