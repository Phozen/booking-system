import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("first-load performance wiring", () => {
  it("caches shared app settings and refreshes them when settings change", () => {
    const settingsQueries = read("lib/settings/queries.ts");
    const settingsActions = read("lib/admin/settings/actions.ts");

    expect(settingsQueries).toContain("unstable_cache");
    expect(settingsQueries).toContain("APP_SETTINGS_CACHE_TAG");
    expect(settingsActions).toContain('revalidateTag(APP_SETTINGS_CACHE_TAG, "max")');
  });

  it("does not rebuild the public login screens on every request", () => {
    expect(read("app/page.tsx")).not.toContain(
      'export const dynamic = "force-dynamic"',
    );
    expect(read("app/(auth)/layout.tsx")).not.toContain(
      'export const dynamic = "force-dynamic"',
    );
    expect(read("app/(auth)/login/page.tsx")).not.toContain(
      'export const dynamic = "force-dynamic"',
    );
  });

  it("skips Supabase session work when the visitor has no auth cookie", () => {
    const middleware = read("lib/supabase/middleware.ts");

    expect(middleware).toContain("hasSupabaseAuthCookie");
    expect(middleware).toContain("request.cookies.getAll()");
  });

  it("shows the login UI instead of a full-screen overlay while public pages load", () => {
    expect(read("app/loading.tsx")).toContain("RouteLoading");
    expect(read("app/loading.tsx")).not.toContain("RouteLoadingTrigger");
    expect(read("app/(auth)/loading.tsx")).toContain("LoginPanel");
    expect(read("app/(app)/loading.tsx")).toContain("RouteLoading");
    expect(read("app/(app)/loading.tsx")).not.toContain("RouteLoadingTrigger");
    expect(read("app/admin/loading.tsx")).not.toContain("RouteLoadingTrigger");
  });
});
