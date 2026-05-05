import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Admin dashboard"
        description={`Signed in as ${user.email}. Use the admin navigation to manage facilities, bookings, approvals, reports, and settings.`}
      />

      <section className="rounded-lg border bg-card p-5 text-card-foreground">
        <h2 className="font-medium">Operations overview</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Review pending approvals, manage booking exceptions, and monitor
          audit-sensitive activity from the admin sections.
        </p>
      </section>
    </main>
  );
}
