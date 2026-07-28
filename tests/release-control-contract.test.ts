import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readRepositoryFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("release-control contract", () => {
  it("keeps all repository quality gates while blocking high production dependency findings", () => {
    const workflow = readRepositoryFile(".github/workflows/ci.yml");

    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
    expect(workflow).toContain("node scripts/scan-secrets.mjs");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run build");
  });

  it("reserves manual Vercel operations for recovery rather than normal releases", () => {
    const workflow = readRepositoryFile(".github/workflows/production-rollback.yml");

    expect(workflow).toContain("vercel rollback");
    expect(workflow).not.toContain("vercel promote");
  });
});
