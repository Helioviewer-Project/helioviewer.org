import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * Check vso sunpy download button correctly brings download link in notification
 */
test.skip("Validate sunpy ssw download button brings notification with dowload link", async ({ page }) => {
  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : Open vso drawer
  await hv.vso_drawer.toggleVisibility();

  // Action 3 : Trigger vso sunpy script creation
  await hv.vso_drawer.triggerSunPyScriptDownload();

  // Action 4 : Assert notification
  await hv.assertNotification("success", "Your Python/SunPy script for requesting science data from the VSO is ready");
});

/**
 * Check vso sunpy download link in notification works as expected
 */
test.skip("Validate sunpy ssw download link downloads sunpy script", async ({ page, browserName }) => {
  // Damn webkit can't download files
  test.fixme(
    browserName === "webkit",
    "We couldn't be able to trigger download event for webkit, skipping this test now"
  );

  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.vso_drawer.toggleVisibility();

  // Action 3 : Trigger vso sunpy script creation
  await hv.vso_drawer.triggerSunPyScriptDownload();

  // Assert notification
  await hv.assertNotification("success", "Your Python/SunPy script for requesting science data from the VSO is ready");

  // Action 5 : Download from notification link
  const sunpyFile = await hv.vso_drawer.downloadSunpyScriptFromNotification();

  // Check if downloaded file contains some strings, needed to be in script
  expect(sunpyFile).toContain("result_aia_304 = Fido.search(a.Time(tstart, tend)");
});
