import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildLoginRequiredPath,
  getSafeLoginNextPath,
  isProtectedPath,
} from "@/lib/auth/protected-paths";

const middlewareSource = readFileSync(
  join(process.cwd(), "lib/supabase/middleware.ts"),
  "utf8",
);
const guardsSource = readFileSync(
  join(process.cwd(), "lib/auth/guards.ts"),
  "utf8",
);

describe("protected path login return URLs", () => {
  it("treats signed-in pages as protected, including leftover notification URLs", () => {
    expect(isProtectedPath("/calendar")).toBe(true);
    expect(isProtectedPath("/invitations")).toBe(true);
    expect(isProtectedPath("/notifications")).toBe(true);
    expect(isProtectedPath("/notification-preferences")).toBe(true);
    expect(isProtectedPath("/admin/dashboard")).toBe(true);
    expect(isProtectedPath("/bookings/abc/print")).toBe(true);
  });

  it("leaves the public login screens unprotected", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
    expect(isProtectedPath("/reset-password")).toBe(false);
  });

  it("keeps a safe return URL on login and drops public or external targets", () => {
    expect(buildLoginRequiredPath("/calendar?month=2026-08")).toBe(
      "/login?auth=required&next=%2Fcalendar%3Fmonth%3D2026-08",
    );
    expect(buildLoginRequiredPath("/login")).toBe("/login?auth=required");
    expect(getSafeLoginNextPath("https://evil.example")).toBeNull();
  });

  it("wires middleware and requireUser to the shared public-path list", () => {
    expect(middlewareSource).toContain('from "@/lib/auth/protected-paths"');
    expect(middlewareSource).not.toContain("protectedPrefixes");
    expect(guardsSource).toContain("buildLoginRequiredPath");
  });
});
