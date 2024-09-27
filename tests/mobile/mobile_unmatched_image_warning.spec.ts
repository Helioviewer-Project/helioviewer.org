import { test, expect } from "@playwright/test";

test("Mobile View: Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.", async ({
  page,
  browserName
}) => {
  test.fixme(
    browserName === "webkit",
    "This test is not behaving on linux's webkit, and we're unable to reproduce the issue."
  );

  await page.goto("/");
  // Set the observation time to about 6 hours ahead of the AIA 304 image time
  // The default image is timestamped at 2021-06-01 00:01:29
  await page.getByLabel("Observation date", { exact: true }).click();
  await page.getByLabel("Observation date", { exact: true }).fill("2021/06/01");
  await page.getByRole("textbox", { name: "Observation time" }).click();
  await page.getByLabel("Hour").click();
  await page.getByLabel("Hour").fill("06");
  await page.getByLabel("Hour").press("Enter");
  await page.getByLabel("Minute", { exact: true }).fill("10");
  await page.getByLabel("Minute", { exact: true }).press("Enter");
  await page.getByLabel("Second").fill("00");
  await page.getByLabel("Second").press("Enter");
  // When the time is set, we should see the warning appear
  await expect(page.getByText("The AIA 304 layer is 6 hours")).toBeVisible();
  // Change the observation time to be < 6 hours away
  await page.getByRole("textbox", { name: "Observation time" }).click();
  await page.getByLabel("Minute", { exact: true }).fill("00");
  await page.getByLabel("Minute", { exact: true }).press("Enter");
  // The notification should disappear since the observation time is within range.
  await expect(page.getByText("The AIA 304 layer is 6 hours")).not.toBeVisible();
});
