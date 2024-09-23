import { test, expect, PageAssertionsToHaveScreenshotOptions, PageScreenshotOptions } from '@playwright/test';
import { HvMobile } from '../page_objects/mobile_hv';

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
test('[Mobile] Center viewport with AIA 304', async ({ page }, info) => {
  let mobile = new HvMobile(page, info);
  await mobile.Load();
  // The date in the notification will change over time, so close it so it's
  // not in the screenshot.
  await mobile.CloseAllNotifications();
  // 1. Center the viewport
  await mobile.CenterViewport();
  // 2. Expect the screenshot to match. Referencing by name so we can re-use it later.
  const centered_aia_304_image = "centered_aia_304.png";
  const opts: PageAssertionsToHaveScreenshotOptions = { mask: [page.locator('#time'), page.locator('#date')] };
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
test('[Mobile] Center viewport with AIA 304 and LASCO C2/C3', async ({ page }, info) => {
  let mobile = new HvMobile(page, info);
  await mobile.Load();
  // 1a. Adds LASCO C2
  await mobile.OpenImageLayerDrawer();
  await mobile.AddImageLayer();
  // 1b. Adds LASCO C3
  await mobile.AddImageLayer();
  await mobile.CloseDrawer();
  // 2. Zoom out to be able to see all layers
  await mobile.ZoomOut(4);
  // Wait for the tiles to load after zooming out.
  await mobile.WaitForLoad();
  // The date in the notification will change over time, so close it so it's
  // not in the screenshot.
  await mobile.CloseAllNotifications();
  // 3. Center the viewport
  await mobile.CenterViewport();
  // 4. Expect the screenshot to match. Referencing by name so we can re-use it later.
  const centered_image = "sdo_soho_centered.png";
  // Rendering seems a bit flaky but not significantly flaky.
  const opts: PageScreenshotOptions = {
    style: '#helioviewer-viewport-container-outer {z-index:200000}',
    scale: "css"
  };
  // On Safari on Mac, the rendering is not consistent... Some white streaks in
  // the image are sometimes thick, and sometimes thin.
  await expect(await page.screenshot(opts)).toMatchSnapshot(centered_image, {maxDiffPixels: 30});
  // 5. Drag the sun off center
  await mobile.moveViewport(250, 250);
  // 6. expect the screenshot not to match
  await expect(await page.screenshot(opts)).not.toMatchSnapshot(centered_image);
  // 7. Center the viewport again
  await mobile.CenterViewport();
  // 8. Expect the screenshot to match again.
  await expect(await page.screenshot(opts)).toMatchSnapshot(centered_image, {maxDiffPixels: 30});
});
