import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

/**
 * This test will make Helioviewer load the default AIA 304 image,
 * will make a screenshot out of it, and view the screenshot and check the filename we download
 * and it should have the correct filename
 */
test("Download from screenshot fullscreen view, should correctly set filename", async ({ page, browserName }) => {
  test.fixme(
    browserName === "webkit",
    "We couldn't be able to trigger download event for webkit, skipping this test now"
  );

  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2: OPEN SCREENSHOT DRAWER
  await hv.screenshot.toggleScreenshotDrawer();

  // ACTION 3: MAKE A SCREENSHOT AND WAIT FOR THE SUCCESS MESSAGE
  await hv.screenshot.createFullScreenshot();
  await hv.screenshot.waitForScreenshotCompleteNotifitication();

  // assert there should be one screenshot in drawer
  await hv.screenshot.assertScreenshotCountFromDrawer(1);

  // ACTION 4: OPEN THE SCREENSHOT TO VIEW IT
  await hv.screenshot.viewScreenshotFromScreenshotHistory(1);
  await hv.WaitForImageLoad();

  // now download screenshot from screenshot view via download button
  const screenshotFileFromScreenshotView = await hv.screenshot.downloadScreenshotFromViewScreenshotFeature();

  // ACTION 5: CLICK TO DOWNLOAD THE SCREENSHOT
  const download = await hv.screenshot.fetchScreenshotFromViewScreenshotFeature();

  // Expect the filename matches with our screenshot filenames
  await expect(download.suggestedFilename()).toMatch(/\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_AIA_304\.png/);
});
