import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { getAdminSystemSettings } from "@/lib/admin/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { profile } = await requireAdmin();

  if (profile?.status !== "active") {
    redirect("/login?error=disabled");
  }

  const supabase = createAdminClient();
  const { settings, rows } = await getAdminSystemSettings(supabase);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Admin area"
        title="System settings"
        description="Configure registration, approval behavior, app identity, timezone, and reminder defaults. Secrets and provider API keys stay in environment variables, not system settings."
      />

      <SettingsForm settings={settings} />

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold tracking-normal">Stored setting rows</h2>
          <p className="text-sm text-muted-foreground">
            Read-only reference for current database-backed settings.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Public</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{row.key}</td>
                  <td className="max-w-[360px] px-4 py-3 font-mono text-xs text-muted-foreground">
                    {JSON.stringify(row.value)}
                  </td>
                  <td className="px-4 py-3">{row.isPublic ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.updatedAt ?? "Default fallback"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
