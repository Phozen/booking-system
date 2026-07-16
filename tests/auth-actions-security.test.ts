import { describe, expect, it } from "vitest";

import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
} from "@/lib/auth/actions";

describe("disabled public authentication actions", () => {
  it.each([
    ["password login", loginAction],
    ["self-registration", registerAction],
    ["password reset", requestPasswordResetAction],
  ])("fails closed for direct %s calls", async (_name, action) => {
    const result = await action(new FormData());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/disabled/i);
    expect(result.message).toMatch(/microsoft/i);
  });
});
