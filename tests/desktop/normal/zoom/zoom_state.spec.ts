import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test simply adds and removes images layers
 */
test("Zoom scale is persisted across reload", async ({ page }, info) => {
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.CloseAllNotifications();
  // Zoom in 5 times
  await hv.ZoomIn(5);
  await hv.WaitForLoadingComplete();
  // move mouse off of zoom button
  await page.mouse.move(100, 0);
  await hv.WaitForImageLoad();
  await page.screenshot({ path: info.snapshotPath("zoom_screenshot.png"), scale: "device" });
  await page.goto("/");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  await hv.WaitForImageLoad();
  await expect(page).toHaveScreenshot(["zoom_screenshot.png"], { maxDiffPixelRatio: 0.01, scale: "device" });
});
