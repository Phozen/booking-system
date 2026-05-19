import { Activity, AlertTriangle, CheckCircle2, Mail, PlugZap } from "lucide-react";
import type { ReactNode } from "react";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { getMicrosoftCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import { normalizeEmailProviderName, getSmtpConfigFromEnv, validateSmtpConfig } from "@/lib/email/smtp-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

type HealthCardProps = {
  title: string;
  status: "ok" | "warning";
  description: string;
  meta?: string;
  icon: ReactNode;
};

function HealthCard({ title, status, description, meta, icon }: HealthCardProps) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-start gap-3">
        <div
          className={
            status === "ok"
              ? "rounded-lg bg-emerald-500/12 p-2 text-emerald-700 dark:text-emerald-300"
              : "rounded-lg bg-amber-500/12 p-2 text-amber-700 dark:text-amber-300"
          }
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold tracking-normal">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {meta ? (
            <p className="mt-3 break-words rounded-md bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
              {meta}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

async function getCount(
  table: "email_notifications" | "booking_calendar_syncs",
  column: string,
  value: string,
) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    return null;
  }

  return count ?? 0;
}

export default async function SystemHealthPage() {
  await requireSuperAdmin();

  const emailProvider = normalizeEmailProviderName(process.env.EMAIL_PROVIDER);
  const emailFrom = process.env.EMAIL_FROM?.trim() ?? "";
  const smtpError =
    emailProvider === "smtp"
      ? validateSmtpConfig(getSmtpConfigFromEnv(process.env))
      : null;
  const microsoftConfig = getMicrosoftCalendarSyncConfig();
  const [failedEmails, queuedEmails, failedSyncs] = await Promise.all([
    getCount("email_notifications", "status", "failed"),
    getCount("email_notifications", "status", "queued"),
    getCount("booking_calendar_syncs", "sync_status", "failed"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super Admin"
        title="System health"
        description="Review operational readiness without exposing provider secrets, tokens, or private keys."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "System health" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <HealthCard
          title="Application configuration"
          status={process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "warning"}
          description="Core public Supabase configuration is checked by key presence only."
          meta={
            process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Supabase URL is present. Secrets are intentionally hidden."
              : "NEXT_PUBLIC_SUPABASE_URL is missing."
          }
          icon={<Activity className="size-5" aria-hidden="true" />}
        />

        <HealthCard
          title="Email provider"
          status={
            emailProvider === "none" ||
            !emailFrom ||
            (emailProvider === "smtp" && smtpError)
              ? "warning"
              : "ok"
          }
          description="SMTP and Resend are environment-driven. Secret values are never displayed here."
          meta={
            emailProvider === "none"
              ? "EMAIL_PROVIDER is none or blank."
              : !emailFrom
                ? "EMAIL_FROM is missing."
                : smtpError
                  ? smtpError
                  : `Provider: ${emailProvider.toUpperCase()}. Failed: ${failedEmails ?? "unknown"}. Queued: ${queuedEmails ?? "unknown"}.`
          }
          icon={<Mail className="size-5" aria-hidden="true" />}
        />

        <HealthCard
          title="Microsoft 365 Calendar"
          status={
            !microsoftConfig.enabled ||
            microsoftConfig.mode === "disabled" ||
            microsoftConfig.isConfigured
              ? "ok"
              : "warning"
          }
          description="One-way calendar sync is safe when disabled and requires Microsoft Entra credentials when enabled."
          meta={
            !microsoftConfig.enabled || microsoftConfig.mode === "disabled"
              ? "Sync disabled. No Microsoft Graph calls should run."
              : microsoftConfig.validationError ??
                `Sync mode: ${microsoftConfig.mode}. Failed syncs: ${failedSyncs ?? "unknown"}.`
          }
          icon={<PlugZap className="size-5" aria-hidden="true" />}
        />

        <HealthCard
          title="Operational follow-up"
          status={
            (failedEmails ?? 0) > 0 || (failedSyncs ?? 0) > 0
              ? "warning"
              : "ok"
          }
          description="Failed email and calendar records should be retried or investigated before production launch."
          meta={
            (failedEmails ?? 0) > 0 || (failedSyncs ?? 0) > 0
              ? `Review ${failedEmails ?? "unknown"} failed email records and ${failedSyncs ?? "unknown"} failed calendar sync records.`
              : "No failed email or calendar sync records were counted."
          }
          icon={
            (failedEmails ?? 0) > 0 || (failedSyncs ?? 0) > 0 ? (
              <AlertTriangle className="size-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            )
          }
        />
      </div>
    </main>
  );
}
