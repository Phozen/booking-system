import { describe, expect, it } from "vitest";

import { getLoginMessage } from "@/components/auth/login-panel";

const settings = { systemContactEmail: "admin@qbook.test" };

describe("login messages", () => {
  it("keeps inactive-account copy for disabled profiles", () => {
    expect(getLoginMessage({ error: "disabled" }, settings)).toBe(
      "Your account is not active. Contact admin@qbook.test for help.",
    );
  });

  it("does not call leftover register and reset URLs inactive accounts", () => {
    expect(getLoginMessage({ error: "legacy" }, settings)).toBe(
      "Email and password sign-in is disabled. Continue with Microsoft.",
    );
  });
});
