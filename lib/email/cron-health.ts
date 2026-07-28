import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

const cronHeartbeatKey = "email_cron_last_run";
const defaultMaxAgeMinutes = 15;

type EmailCronEnv = {
  EMAIL_CRON_MAX_AGE_MINUTES?: string;
};

function getEmailCronEnv(): EmailCronEnv {
  return {
    EMAIL_CRON_MAX_AGE_MINUTES: process.env.EMAIL_CRON_MAX_AGE_MINUTES,
  };
}

export type EmailCronMonitor = {
  checkedAt: string;
  lastRunAt: string | null;
  lastRunHealthy: boolean | null;
  maxAgeMinutes: number;
  stale: boolean;
  readable: boolean;
  healthy: boolean;
};

function getMaxAgeMinutes(env: EmailCronEnv = getEmailCronEnv()) {
  const configured = Number.parseInt(
    env.EMAIL_CRON_MAX_AGE_MINUTES ?? "",
    10,
  );

  return Number.isFinite(configured) && configured >= 5 && configured <= 24 * 60
    ? configured
    : defaultMaxAgeMinutes;
}

function parseHeartbeat(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const completedAt = record.completedAt;
  const healthy = record.healthy;
  const parsedDate =
    typeof completedAt === "string" ? new Date(completedAt) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || typeof healthy !== "boolean") {
    return null;
  }

  return { completedAt: parsedDate.toISOString(), healthy };
}

export async function recordEmailCronRun(
  healthy: boolean,
  supabase: SupabaseClient = createAdminClient(),
  completedAt = new Date(),
) {
  const { error } = await supabase.from("system_settings").upsert(
    {
      key: cronHeartbeatKey,
      value: { completedAt: completedAt.toISOString(), healthy },
      description: "Internal email automation heartbeat. Managed by Qbook.",
      is_public: false,
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error("Email automation heartbeat could not be recorded.");
  }
}

export async function getEmailCronMonitor(
  supabase: SupabaseClient = createAdminClient(),
  now = new Date(),
  env: EmailCronEnv = getEmailCronEnv(),
): Promise<EmailCronMonitor> {
  const maxAgeMinutes = getMaxAgeMinutes(env);
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", cronHeartbeatKey)
    .maybeSingle();

  const heartbeat = error ? null : parseHeartbeat(data?.value);
  const stale =
    !heartbeat ||
    now.getTime() - new Date(heartbeat.completedAt).getTime() >
      maxAgeMinutes * 60_000;

  return {
    checkedAt: now.toISOString(),
    lastRunAt: heartbeat?.completedAt ?? null,
    lastRunHealthy: heartbeat?.healthy ?? null,
    maxAgeMinutes,
    stale,
    readable: !error,
    healthy: !error && Boolean(heartbeat?.healthy) && !stale,
  };
}
