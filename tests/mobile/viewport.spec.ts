import { test, expect, PageAssertionsToHaveScreenshotOptions, PageScreenshotOptions } from "@playwright/test";
import { HvMobile } from "../page_objects/mobile_hv";

/**
 * This tests centering the viewport on mobile devices.
 * Test Steps:
 *   1. Center viewport
 *   2. Expect a specific screenshot to match
 *   3. Drag the sun off center
 *   4. Expect the screenshot not to match
 *   5. Center viewport again
 *   6. Expect the screenshot to match again
 */
test("[Mobile] Center viewport with AIA 304", async ({ page }, info) => {
  let mobile = new HvMobile(page, info);
  await mobile.Load();
  // The date in the notification will change over time, so close it so it's
  // not in the screenshot.
  await mobile.CloseAllNotifications();
  // 1. Center the viewport
  await mobile.CenterViewport();
  // 2. Expect the screenshot to match. Referencing by name so we can re-use it later.
  const centered_aia_304_image = "centered_aia_304.png";
  const opts: PageAssertionsToHaveScreenshotOptions = { mask: [page.locator("#time"), page.locator("#date")] };
  await expect(page).toHaveScreenshot(centered_aia_304_image, opts);
  // 3. Drag the sun off center
  await mobile.moveViewport(250, 250);
  // 4. expect the screenshot not to match
  await expect(page).not.toHaveScreenshot(centered_aia_304_image, opts);
  // 5. Center the viewport again
  await mobile.CenterViewport();
  // 6. Expect the screenshot to match again.
  await expect(page).toHaveScreenshot(centered_aia_304_image, opts);
});

/**
 * This tests centering the viewport on mobile devices with more layers
 * Test Steps:
 *   1. Add additional layers
 *   2. Zoom out to be able to see all layers
 *   3. Center viewport
 *   4. Expect a specific screenshot to match
 *   5. Drag the sun off center
 *   6. Expect the screenshot not to match
 *   7. Center viewport again
 *   8. Expect the screenshot to match again
 */
test("[Mobile] Center viewport with AIA 304 and LASCO C2/C3", async ({ page }, info) => {
  let mobile = new HvMobile(page, info);
  await mobile.Load();
  // 1a. Adds LASCO C2
  await mobile.OpenImageLayerDrawer();
  await mobile.AddImageLayer();
  // 1b. Adds LASCO C3
  await mobile.AddImageLayer();
  await mobile.CloseDrawer();
  await mobile.CloseAllNotifications();

  // 2. Zoom out to be able to see all layers
  await mobile.ZoomOut(1);
  await mobile.WaitForLoad();

  await mobile.ZoomOut(1);
  await mobile.WaitForLoad();

  await mobile.ZoomOut(1);
  await mobile.WaitForLoad();

  await mobile.ZoomOut(1);

  // Wait for the tiles to load after zooming out.
  await mobile.WaitForLoad();
  // The date in the notification will change over time, so close it so it's
  // not in the screenshot.

  // 3. Center the viewport
  await mobile.CenterViewport();
  await mobile.WaitForLoad();

  // await mobile.WaitForLoad();
  // 4. Expect the screenshot to match. Referencing by name so we can re-use it later.
  const centered_image = "sdo_soho_centered.png";
  // Rendering seems a bit flaky but not significantly flaky.
  const opts: PageScreenshotOptions = {
    style: "#helioviewer-viewport-container-outer {z-index:200000}",
    scale: "css"
  };
  // On Safari on Mac, the rendering is not consistent... Some white streaks in
  // the image are sometimes thick, and sometimes thin.
  await expect(await page.screenshot(opts)).toMatchSnapshot(centered_image);
  // 5. Drag the sun off center
  await mobile.moveViewport(250, 250);
  // 6. expect the screenshot not to match
  await expect(await page.screenshot(opts)).not.toMatchSnapshot(centered_image);
  // 7. Center the viewport again
  await mobile.CenterViewport();
  // 8. Expect the screenshot to match again.
  await expect(await page.screenshot(opts)).toMatchSnapshot(centered_image);
});

/**
 * Tests the controls for the viewport scale feature.
 * 1. The page initializes with the earth scale being visible.
 * 2. Change to bar scale
 * 3. Disable image scale
 * 4. Show earth scale
 * 5. Disable earth scale.
 */
test("[Mobile] Switch between earth scale, bar scale, and no scale", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  // 1. The page initializes with the earth scale being visible.
  await mobile.scale_indicator.assertEarthIsVisible();
  // 2. Change to bar scale
  await mobile.scale_indicator.TapBarScale();
  await mobile.scale_indicator.assertBarIsVisible();
  // 3. Disable image scale by choosing the bar scale again
  await mobile.scale_indicator.TapBarScale();
  await mobile.scale_indicator.assertHidden();
  // 4. Show earth scale
  await mobile.scale_indicator.TapEarthScale();
  await mobile.scale_indicator.assertEarthIsVisible();
  // 5. Disable earth scale.
  await mobile.scale_indicator.TapEarthScale();
  await mobile.scale_indicator.assertHidden();
});

/**
 * The scale indicator is meant to show the scale of the earth with respect to the sun.
 * As a user zooms in and out to scale the size of the sun, the scale indicator
 * must also change size to match the scale of the earth.
 *
 * 1. Check initial earth scale
 * 2. Zoom in, check 2nd, 3rd, 4th, level earth scale
 * 3. Zoom out, re-check initial earth scale
 * 4. Repeat steps 1-3 with bar scale
 */
test("[Mobile] Verify earth/bar indicator scales with zoom", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  // 1. Check initial earth scale
  await mobile.scale_indicator.assertEarthIsVisible();
  // 2. Zoom in, check 2nd, 3rd, 4th, level earth scale
  await mobile.scale_indicator.assertSizeMatches(4, 4);
  await mobile.ZoomIn(1);
  await mobile.scale_indicator.assertSizeMatches(7, 7);
  await mobile.ZoomIn(1);
  await mobile.scale_indicator.assertSizeMatches(15, 15);
  await mobile.ZoomIn(1);
  await mobile.scale_indicator.assertSizeMatches(29, 29);
  // 3. Zoom out, re-check initial earth scale
  await mobile.ZoomOut(3);
  await mobile.scale_indicator.assertSizeMatches(4, 4);

  // 4. Repeat steps with bar scale
  await mobile.scale_indicator.TapBarScale();
  // 4.1 Check initial bar scale
  await mobile.scale_indicator.assertBarScaleLabelMatches("175,000");
  // 4.2. Zoom in, check 2nd, 3rd, 4th, level scale
  await mobile.ZoomIn(1);
  await mobile.scale_indicator.assertBarScaleLabelMatches("88,000");
  await mobile.ZoomIn(1);
  await mobile.scale_indicator.assertBarScaleLabelMatches("44,000");
  await mobile.ZoomIn(1);
  await mobile.scale_indicator.assertBarScaleLabelMatches("22,000");
  // 4.3 Zoom out, re-check initial scale
  await mobile.ZoomOut(3);
  await mobile.scale_indicator.assertBarScaleLabelMatches("175,000");
});
