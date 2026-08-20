import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { approveBookingConfirmation } from "@/components/admin/approvals/approve-booking-confirmation";

const detailSource = readFileSync(
  join(process.cwd(), "components/admin/bookings/admin-booking-detail.tsx"),
  "utf8",
);
const rowActionsSource = readFileSync(
  join(
    process.cwd(),
    "components/admin/approvals/pending-approval-row-actions.tsx",
  ),
  "utf8",
);

describe("approve booking confirmation", () => {
  it("asks before approving from the pending list and booking detail", () => {
    expect(detailSource).toContain("confirmation={approveBookingConfirmation}");
    expect(rowActionsSource).toContain("approveBookingConfirmation.title");
    expect(rowActionsSource).toContain('triggerLabel="Approve"');
    expect(approveBookingConfirmation.title).toBe(
      "Approve this booking request?",
    );
    expect(approveBookingConfirmation.confirmLabel).toBe("Approve booking");
    expect(approveBookingConfirmation.cancelLabel).toBe("Keep pending");
  });
});
