import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "components/bookings/booking-detail.tsx"),
  "utf8",
).replace(/\s+/g, " ");

describe("booking detail header actions", () => {
  it("removes the header divider and extra bottom spacing", () => {
    expect(source).toContain("<header>");
    expect(source).not.toMatch(/<header className="[^"]*border-b/);
  });

  it("keeps the highest-priority available action primary in one wrapping row", () => {
    expect(source).toContain('className="mt-5 flex flex-wrap gap-2"');
    expect(source).not.toContain('className="flex flex-col gap-2 sm:flex-row"');
    expect(source).toContain(
      'const primaryHeaderAction = teamsJoinUrl ? "teams" : calendarEventAvailable ? "calendar" : canEdit ? "edit" : "print";',
    );
    expect(source).toMatch(
      /href=\{teamsJoinUrl\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"[\s\S]*?bg-\[#5b5fc7\][\s\S]*?Join Teams Meeting/,
    );
    expect(source).toMatch(
      /href=\{`\/bookings\/\$\{booking\.id\}\/calendar`\}[\s\S]*?variant: primaryHeaderAction === "calendar" \? "default" : "outline"[\s\S]*?View Outlook Calendar/,
    );
    expect(source).toMatch(
      /loadingVariant="form"[\s\S]*?variant: primaryHeaderAction === "edit" \? "default" : "outline"[\s\S]*?>[\s\S]*?Edit\s*</,
    );
    expect(source).toMatch(
      /href=\{`\/bookings\/\$\{booking\.id\}\/print`\}[\s\S]*?variant: primaryHeaderAction === "print" \? "default" : "outline"[\s\S]*?Print Form/,
    );
  });
});
