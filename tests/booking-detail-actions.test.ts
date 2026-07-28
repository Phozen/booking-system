import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "components/bookings/booking-detail.tsx"),
  "utf8",
).replace(/\s+/g, " ");

describe("booking detail header actions", () => {
  it("removes the header divider while retaining spacing", () => {
    expect(source).toContain('className="pb-6"');
    expect(source).not.toMatch(/<header className="[^"]*border-b/);
  });

  it("places distinct coloured actions below the booking title in one wrapping row", () => {
    expect(source).toContain('className="mt-5 flex flex-wrap gap-2"');
    expect(source).not.toContain('className="flex flex-col gap-2 sm:flex-row"');
    expect(source).toMatch(
      /href=\{teamsJoinUrl\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"[\s\S]*?variant: "success"[\s\S]*?Join Meeting/,
    );
    expect(source).toMatch(
      /href=\{`\/bookings\/\$\{booking\.id\}\/calendar`\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"[\s\S]*?bg-sky-600[\s\S]*?View on Calendar/,
    );
    expect(source).toMatch(
      /loadingVariant="form"[\s\S]*?variant: "warning"[\s\S]*?Edit \/ reschedule/,
    );
    expect(source).toMatch(
      /href=\{`\/bookings\/\$\{booking\.id\}\/print`\}[\s\S]*?bg-violet-600[\s\S]*?Print approval form/,
    );
  });
});
