import { test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test will make Helioviewer load the default AIA 304 image that is
 * embedded in the development container and perform a visual comparison to make
 * sure the page appears how we expect it to appear.
 */
test("Selecting image presets should not spoil integer state variables", async ({ page }) => {
  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.ClickDataSourcesTab();

  // Action 3: Load preset Eruption Monitor
  await hv.SelectImagePreset("Eruption Monitor");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // Action 4: Try to share screen
  await hv.urlshare.triggerShareURL();

  // Action 5: Check if the shared url is prepared
  await hv.urlshare.sharedURLIsVisibleAndDone();
});
