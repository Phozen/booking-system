import { expect, test } from "@playwright/test";

test.describe("preview hygiene", () => {
  test("login shell loads without client errors or failed first-party assets", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const failedFirstPartyResponses: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      const responseUrl = new URL(response.url());
      const configuredBaseUrl = new URL(
        process.env.E2E_BASE_URL ?? "http://localhost:3000",
      );

      if (
        responseUrl.origin === configuredBaseUrl.origin &&
        response.status() >= 500
      ) {
        failedFirstPartyResponses.push(
          `${response.status()} ${responseUrl.pathname}`,
        );
      }
    });

    await page.goto("/login");

    await expect(
      page.getByRole("button", { name: "Continue with Microsoft" }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/stack trace|debug mode/i);
    expect(pageErrors).toEqual([]);
    expect(failedFirstPartyResponses).toEqual([]);
  });
});
