/**
 * This test verifies that the image warning notifications are working as expected
 * Helioviewer creates a warning if the image that is loaded is > 6 hours away
 * from the desired observation time.
 *
 * Test Prerequisites:
 * - Use the default development environment where there is only 1 AIA 304 and 1 AIA 171 image
 *   with timestamps 2021-06-1 00:01:29 and 2021-06-01 00:01:21 respectively
 *
 * Test Procedure:
 * 1. Set the observation time to 2021-06-01 06:10:00 which is a
 *    little more than 6 hours past the image times
 * 2. Assert that the notification appears
 * 3. Set the observation time to 2021-06-01 00:00:00 which is less than 6 hours
 *    away from the image time
 * 4. Assert that the notification disappears.
 *
 */
import { test, expect } from "@playwright/test";

test("[Normal] Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.", async ({
  page
}) => {
  await page.goto("/");
  // Close the initial notifications that come up
  // The first time visit tutorial & the image warning will show
  await page.getByText("[ close all ]").click();
  // Open the sidebar
  await page.locator("#hv-drawer-tab-left").click();
  // Set the observation time to about 6 hours ahead of the AIA 304 image time
  // The default image is timestamped at 2021-06-01 00:01:29
  await page.getByLabel("Observation time").click();
  await page.getByLabel("Observation time").fill("06:10:00");
  // Switch to the date
  await page.getByLabel("Observation time").press("Shift+Tab");
  // Set the date time to 2024/01/01
  await page.getByLabel("Observation date", { exact: true }).fill("2021/06/01");
  await page.getByLabel("Observation date", { exact: true }).press("Enter");
  // Wait for page to load
  await page.waitForFunction(() => document.getElementById("loading")?.style.display == "none", null, {
    timeout: 90000
  });
  // Expect the warning to appear with the expected text
  await expect(page.getByText("The AIA 304 layer is 6 hours")).toBeVisible();
  // Expect there to be only one notification with this message
  await expect(await page.getByText("The AIA 304 layer is 6 hours").count()).toBe(1);
  // Change the time to be < 6 hours away from the AIA 304 image
  await page.getByLabel("Observation time").click();
  await page.getByLabel("Observation time").fill("00:00:00");
  await page.getByLabel("Observation time").press("Enter");
  // Wait for page to load
  await page.waitForFunction(() => document.getElementById("loading")?.style.display == "none", null, {
    timeout: 90000
  });
  // Expect the warning to disappear with the expected text
  await expect(page.getByText("The AIA 304 layer is 6 hours")).not.toBeVisible();
});

test("[Minimal] Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.", async ({
  page
}) => {
  await page.goto("/?output=minimal");
  // Set the date to 6 hours away from the test image
  await page.getByLabel("Date").click();
  await page.getByLabel("Date").fill("2021/06/01");
  await page.getByLabel("Date").press("Enter");
  await page.getByRole("textbox", { name: "Time" }).click();
  await page.getByRole("textbox", { name: "Time" }).fill("06:10:00");
  await page.getByRole("textbox", { name: "Time" }).press("Enter");
  // Wait for page to load
  await page.waitForFunction(() => document.getElementById("loading")?.style.display == "none", null, {
    timeout: 90000
  });
  // Expect the warning to appear
  await expect(page.getByText("The AIA 171 layer is 6 hours")).toBeVisible();
  // Expect there to be only one notification with this message
  // There was initially a bug causing multiple notifications to appear for output=minimal
  await expect(await page.getByText("The AIA 171 layer is 6 hours").count()).toBe(1);
  // Set the time to < 6 hours
  await page.getByRole("textbox", { name: "Time" }).click();
  await page.getByRole("textbox", { name: "Time" }).fill("00:00:00");
  await page.getByRole("textbox", { name: "Time" }).press("Enter");
  // Wait for page to load
  await page.waitForFunction(() => document.getElementById("loading")?.style.display == "none", null, {
    timeout: 90000
  });
  // Expect the warning to disappear
  await expect(page.getByText("The AIA 171 layer is 6 hours")).not.toBeVisible();
});

test("[Embed] Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.", async ({
  page
}) => {
  await page.goto("?output=embed&date=2024-01-01T00:00:00Z");
  // Expect the warning to appear with the expected text
  await expect(page.getByText("The AIA 304 layer is 364 days")).toBeVisible();
  // Load a date approximately 6 hours away
  await page.goto("?output=embed&date=2021-06-01T06:10:00Z");
  await expect(page.getByText("The AIA 304 layer is 6 hours")).toBeVisible();
  // Load a date approximately less than hours away
  await page.goto("?output=embed&date=2021-06-01T00:00:00Z");
  await expect(page.getByText("The AIA 304 layer is 6 hours")).not.toBeVisible();
});
