import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const bookingDetailSource = readFileSync(
  join(process.cwd(), "components/bookings/booking-detail.tsx"),
  "utf8",
).replace(/\s+/g, " ");

const pageHeaderSource = readFileSync(
  join(process.cwd(), "components/shared/page-header.tsx"),
  "utf8",
).replace(/\s+/g, " ");

describe("booking detail header actions", () => {
  it("delegates header chrome to PageHeader without a local bordered header shell", () => {
    expect(bookingDetailSource).toContain("<PageHeader");
    expect(bookingDetailSource).not.toMatch(/<header className="[^"]*border-b/);
    expect(pageHeaderSource).toContain("<header");
    expect(pageHeaderSource).not.toMatch(/<header className="[^"]*border-b/);
  });

  it("shows the primary action above secondaries on mobile", () => {
    expect(pageHeaderSource).toContain("flex-col-reverse");
    expect(pageHeaderSource).toContain("{secondaryAction} {primaryAction}");
  });

  it("keeps exactly one filled primary action with outline secondaries in a wrapping row", () => {
    expect(bookingDetailSource).toContain('className="flex flex-wrap gap-2"');
    expect(bookingDetailSource).not.toContain(
      'className="flex flex-col gap-2 sm:flex-row"',
    );
    expect(bookingDetailSource).toContain("const primaryAction =");
    expect(bookingDetailSource).toContain("teamsIsPrimary");
    expect(bookingDetailSource).toMatch(
      /canEdit \? \( <RouteLoadingLink[\s\S]*?buttonVariants\(\{ size: "lg", className: "w-full min-h-11 sm:w-auto" \}\)[\s\S]*?Edit booking/,
    );
    expect(bookingDetailSource).toMatch(
      /href=\{teamsJoinUrl\}[\s\S]*?buttonVariants\(\{ className: "w-full sm:w-auto" \}\)[\s\S]*?Join Teams meeting/,
    );
    expect(bookingDetailSource).toMatch(
      /variant: "outline"[\s\S]*?Outlook calendar/,
    );
    expect(bookingDetailSource).toMatch(
      /variant: "outline"[\s\S]*?Print form/,
    );
    expect(bookingDetailSource).not.toContain("Print approval form");
    expect(bookingDetailSource).toContain("primaryAction={primaryAction}");
    expect(bookingDetailSource).toContain("secondaryAction={");
  });
});
