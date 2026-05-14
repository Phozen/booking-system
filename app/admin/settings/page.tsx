import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAdminSystemSettings } from "@/lib/admin/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { profile } = await requireSuperAdmin();

  if (profile?.status !== "active") {
    redirect("/login?error=disabled");
  }

  const supabase = createAdminClient();
  const { settings, rows } = await getAdminSystemSettings(supabase);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super admin area"
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
        <div className="grid gap-3 p-3 md:hidden">
          {rows.map((row) => (
            <article
              key={row.key}
              className="grid gap-3 rounded-lg border bg-background p-4 text-sm"
            >
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Setting
                </p>
                <h3 className="mt-1 break-words font-semibold tracking-normal">
                  {row.key}
                </h3>
              </div>
              <dl className="grid gap-3">
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Value
                  </dt>
                  <dd className="mt-1 break-words font-mono text-xs text-muted-foreground">
                    {JSON.stringify(row.value)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Public
                  </dt>
                  <dd>{row.isPublic ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Updated
                  </dt>
                  <dd className="break-words text-muted-foreground">
                    {row.updatedAt ?? "Default fallback"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <p className="hidden px-4 pt-3 text-xs text-muted-foreground md:block lg:hidden">
          Scroll horizontally to see all columns.
        </p>
        <div className="hidden overflow-x-auto md:block">
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
