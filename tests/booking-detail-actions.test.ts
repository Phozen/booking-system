import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "components/bookings/booking-detail.tsx"),
  "utf8",
).replace(/\s+/g, " ");

describe("booking detail header actions", () => {
  it("removes the header divider while retaining spacing", () => {
    expect(source).toContain('className="flex flex-col gap-4 pb-6');
    expect(source).not.toContain("gap-4 border-b pb-6");
  });

  it("keeps all header actions in one coloured, wrapping row", () => {
    expect(source).toContain('className="flex flex-wrap gap-2 sm:justify-end"');
    expect(source).not.toContain('className="flex flex-col gap-2 sm:flex-row"');
    expect(source).toMatch(
      /href=\{teamsJoinUrl\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"[\s\S]*?variant: "default"[\s\S]*?Join Meeting/,
    );
    expect(source).toMatch(
      /href=\{`\/bookings\/\$\{booking\.id\}\/calendar`\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"[\s\S]*?variant: "default"[\s\S]*?View on Calendar/,
    );
    expect(source).toMatch(
      /loadingVariant="form"[\s\S]*?variant: "default"[\s\S]*?Edit \/ reschedule/,
    );
    expect(source).toMatch(
      /href=\{`\/bookings\/\$\{booking\.id\}\/print`\}[\s\S]*?variant: "default"[\s\S]*?Print approval form/,
    );
  });
});
