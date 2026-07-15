import { redirect } from "next/navigation";

export default function LegacyNewBlockedPeriodPage() {
  redirect("/admin/unavailability/new?type=closure");
}
