import { test, expect } from "@playwright/test";

/**
 * This test will make Helioviewer load the default AIA 304 image that is
 * embedded in the development container and perform a visual comparison to make
 * sure the page appears how we expect it to appear.
 */
test("Embed page loads", async ({ page }) => {
  await page.goto("/?output=embed");
  await expect(page.locator("#center-button")).toBeVisible();
  await expect(page.getByText("Earth Scale")).toBeVisible();
});
