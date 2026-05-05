import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing server-only Supabase admin environment variables.");
  }

  return { supabaseUrl, serviceRoleKey };
}

export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();

  // Service role bypasses RLS. Keep this helper server-only.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
