import { test, expect } from "@playwright/test";
import { HvMobile } from "../../page_objects/mobile_hv";

/**
 * A recurring issue in Helioviewer deals with computing which tiles should
 * be displayed in the viewport based on the screen size, zoom amount, and
 * the image container position. This test verifies that tiles are loaded
 * properly when the viewport region intersects with tile boundaries.
 *
 * This test was written for a case where 3/4 of the sun does not show after
 * zoomg in.
 * This test was made for: https://github.com/Helioviewer-Project/helioviewer.org/issues/607
 * This issue references the problem on a desktop view, I was able to reproduce
 * only on a mobile view, but the viewport code is shared, so hopefully fixing
 * this problem fixes both problems.
 *
 * Test Steps:
 * 1. Drag the sun up, the issue only happens with the sun in certain positions.
 * 2. Zoom In enough to trigger the resolution update
 * 3. Verify that all 4 expected image tiles are loaded.
 *
 * This test verifies that the black space does NOT remain, and that the tile does get loaded
 * when it is dragged into the viewport.
 */
test(`[Mobile] Verify image tiles are loaded when the viewport pans to tile boundaries after zooming in and out`, async ({
  page
}) => {
  let hv = new HvMobile(page);
  await hv.Load();
  await hv.WaitForLoad();
  // 1. Drag the sun up
  await hv.moveViewport(0, -150);
  // 2. Zoom in one step to trigger the resolution update
  await hv.ZoomIn(1);
  await hv.WaitForLoad();
  // 3. At this level, 4 tiles should be visible
  await expect(page.locator("//img[contains(@src, 'x=0&y=0')]")).toHaveCount(1);
  await expect(page.locator("//img[contains(@src, 'x=-1&y=0')]")).toHaveCount(1);
  await expect(page.locator("//img[contains(@src, 'x=0&y=-1')]")).toHaveCount(1);
  await expect(page.locator("//img[contains(@src, 'x=-1&y=-1')]")).toHaveCount(1);
});
