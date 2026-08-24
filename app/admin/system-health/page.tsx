import { Activity, AlertTriangle, CheckCircle2, Mail, PlugZap } from "lucide-react";
import type { ReactNode } from "react";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { getEmailAppUrlConfig } from "@/lib/email/app-url";
import { getEmailCronMonitor } from "@/lib/email/cron-health";
import { getMicrosoftCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import { normalizeEmailProviderName, getSmtpConfigFromEnv, validateSmtpConfig } from "@/lib/email/smtp-config";
import { getEmailQueueHealth } from "@/lib/email/health";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

type HealthCardProps = {
  title: string;
  status: "ok" | "warning";
  description?: string;
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
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
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
  const appUrlConfig = getEmailAppUrlConfig();
  const [emailHealth, emailCronMonitor, queuedEmails, failedSyncs] = await Promise.all([
    getEmailQueueHealth(),
    getEmailCronMonitor(),
    getCount("email_notifications", "status", "queued"),
    getCount("booking_calendar_syncs", "sync_status", "failed"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super Admin"
        title="System health"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "System health" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <HealthCard
          title="Application configuration"
          status={
            process.env.NEXT_PUBLIC_SUPABASE_URL && appUrlConfig.appUrl
              ? "ok"
              : "warning"
          }
          meta={
            !process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "NEXT_PUBLIC_SUPABASE_URL is missing."
              : appUrlConfig.validationError ??
                "Supabase and canonical Qbook app URLs are present. Secrets are intentionally hidden."
          }
          icon={<Activity className="size-5" aria-hidden="true" />}
        />

        <HealthCard
          title="Email provider"
          status={
            emailProvider === "none" ||
            emailProvider !== "smtp" ||
            !emailFrom ||
            Boolean(smtpError)
              ? "warning"
              : "ok"
          }
          meta={
            emailProvider === "none"
              ? "EMAIL_PROVIDER is none or blank."
              : emailProvider !== "smtp"
                ? `Unsupported EMAIL_PROVIDER=${emailProvider}. Use smtp.`
                : !emailFrom
                  ? "EMAIL_FROM is missing."
                  : smtpError
                    ? smtpError
                    : `Provider: SMTP. Failed: ${emailHealth.failed}. Overdue: ${emailHealth.overdueQueued}. Stale sending: ${emailHealth.staleSending}. Queued: ${queuedEmails ?? "unknown"}.`
          }
          icon={<Mail className="size-5" aria-hidden="true" />}
        />

        <HealthCard
          title="Email automation"
          status={emailCronMonitor.healthy ? "ok" : "warning"}
          description="The protected email cycle should run at least every five minutes through the approved external scheduler."
          meta={
            !emailCronMonitor.readable
              ? "The email automation heartbeat could not be read."
              : !emailCronMonitor.lastRunAt
                ? "No completed email automation cycle has been recorded yet."
                : emailCronMonitor.stale
                  ? `The last completed cycle was ${emailCronMonitor.lastRunAt}. It is older than the ${emailCronMonitor.maxAgeMinutes}-minute limit.`
                  : emailCronMonitor.lastRunHealthy
                    ? `Last successful cycle: ${emailCronMonitor.lastRunAt}.`
                    : `Last cycle completed with operator follow-up required: ${emailCronMonitor.lastRunAt}.`
          }
          icon={<Activity className="size-5" aria-hidden="true" />}
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
            !emailHealth.healthy || (failedSyncs ?? 0) > 0
              ? "warning"
              : "ok"
          }
          description="Failed email and calendar records should be retried or investigated before production launch."
          meta={
            !emailHealth.healthy || (failedSyncs ?? 0) > 0
              ? `Review ${emailHealth.failed} failed, ${emailHealth.overdueQueued} overdue, ${emailHealth.staleSending} stale-sending email records and ${failedSyncs ?? "unknown"} failed calendar sync records.`
              : "No failed, overdue, stale email, or failed calendar sync records were counted."
          }
          icon={
            !emailHealth.healthy || (failedSyncs ?? 0) > 0 ? (
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
