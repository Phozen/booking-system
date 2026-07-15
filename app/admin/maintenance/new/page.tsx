import { redirect } from "next/navigation";

export default function LegacyNewMaintenancePage() {
  redirect("/admin/unavailability/new?type=maintenance");
}
