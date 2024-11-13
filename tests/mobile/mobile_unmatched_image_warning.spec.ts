import { test, expect } from "@playwright/test";
import { HvMobile } from "page_objects/mobile_hv";

test("Mobile View: Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.", async ({
  page,
  browserName
}) => {
  test.fixme(
    browserName === "webkit",
    "This test is not behaving on linux's webkit, and we're unable to reproduce the issue."
  );
  const hv = new HvMobile(page);

  await page.goto("/");
  // Set the observation time to about 6 hours ahead of the AIA 304 image time
  // The default image is timestamped at 2021-06-01 00:01:29
  hv.SetObservationDateTime("2021/06/01", "06:10:00");
  // When the time is set, we should see the warning appear
  await expect(page.getByText("The AIA 304 layer is 6 hours")).toBeVisible();
  // Change the observation time to be < 6 hours away
  hv.SetObservationDateTime("2021/06/01", "06:00:00");
  // The notification should disappear since the observation time is within range.
  await expect(page.getByText("The AIA 304 layer is 6 hours")).not.toBeVisible();
});
