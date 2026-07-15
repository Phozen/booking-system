import { redirect } from "next/navigation";

export default function LegacyBlockedDatesPage() {
  redirect("/admin/unavailability");
}
