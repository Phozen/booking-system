import { redirect } from "next/navigation";

export default function LegacyMaintenancePage() {
  redirect("/admin/unavailability");
}
