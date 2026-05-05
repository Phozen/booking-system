import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  appSettingsToRows,
  getAppSettings,
  type AppSettings,
} from "@/lib/settings/queries";

export type AdminSystemSettings = {
  settings: AppSettings;
  rows: {
    key: string;
    value: unknown;
    description: string | null;
    isPublic: boolean;
    updatedAt: string | null;
  }[];
};

type SystemSettingRecord = {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string | null;
};

export async function getAdminSystemSettings(
  supabase: SupabaseClient,
): Promise<AdminSystemSettings> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("key,value,description,is_public,updated_at")
    .order("key", { ascending: true });

  if (error) {
    throw new Error("Unable to load system settings.");
  }

  const settings = await getAppSettings(supabase);
  const existingRows = ((data as SystemSettingRecord[] | null) ?? []).map(
    (row) => ({
      key: row.key,
      value: row.value,
      description: row.description,
      isPublic: row.is_public,
      updatedAt: row.updated_at,
    }),
  );
  const existingKeys = new Set(existingRows.map((row) => row.key));
  const defaultRows = appSettingsToRows(settings)
    .filter((row) => !existingKeys.has(row.key))
    .map((row) => ({
      key: row.key,
      value: row.value,
      description: row.description,
      isPublic: row.is_public,
      updatedAt: null,
    }));

  return {
    settings,
    rows: [...existingRows, ...defaultRows].sort((a, b) =>
      a.key.localeCompare(b.key),
    ),
  };
}

