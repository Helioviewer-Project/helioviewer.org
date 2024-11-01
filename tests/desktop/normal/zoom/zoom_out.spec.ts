import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test;
 * - load helioviewer
 * - zoom one out with button
 * - take screenshot
 * - load helioviewer with clean state, with ?imageScale=9.68176352 indicating zoom 1 out scale value
 * - screenshot should match previous screenshot
 */
test("Pressing zoom out button should zoom sun out", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. ZOOM ONE OUT WITH BUTTON
  await hv.ZoomOut(1);
  await hv.WaitForLoadingComplete();

  // 4. TAKE A SCREENSHOT
  await hv.sunScreenshot("zoom-one-out-with-button-screenshot.png");

  // 5. LOAD HELIOVIEWER WITH CLEAN STATE, WITH ?IMAGESCALE=9.68176352 INDICATING ZOOM 1 OUT SCALE VALUE
  await page.evaluate(() => localStorage.clear());
  await hv.Load("/?imageScale=9.68176352");
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 6. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 7. TAKE ANOTHER SCREENSHOT
  const zoomOneOutWithURL = await hv.sunScreenshot("zoom-one-out-with-url-screenshot");

  // 8. BOTH SCREENSHOT SHOULD MATCH
  expect(Buffer.from(zoomOneOutWithURL, "base64")).toMatchSnapshot("zoom-one-out-with-button-screenshot.png", {
    maxDiffPixelRatio: 0.01
  });
});

/**
 * This test;
 * - load helioviewer
 * - zoom one out with keyboard - char
 * - take screenshot
 * - load helioviewer with clean state, with ?imageScale=9.68176352 indicating zoom 1 out scale value
 * - screenshot should match previous screenshot
 */
test("Pressing zoom out with keyboard - should zoom sun out", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. ZOOM ONE OUT WITH KEYBOARD "-"
  await page.keyboard.press("-");
  await hv.WaitForLoadingComplete();

  // 4. TAKE A SCREENSHOT
  await hv.sunScreenshot("zoom-one-out-with-keyboard-screenshot.png");

  // 5. LOAD HELIOVIEWER WITH CLEAN STATE, WITH ?IMAGESCALE=9.68176352 INDICATING ZOOM 1 OUT SCALE VALUE
  await page.evaluate(() => localStorage.clear());
  await hv.Load("/?imageScale=9.68176352");
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 6. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 7. TAKE ANOTHER SCREENSHOT
  const zoomOneOutWithURL = await hv.sunScreenshot("zoom-one-out-with-url-screenshot");

  // 8. BOTH SCREENSHOT SHOULD MATCH
  expect(Buffer.from(zoomOneOutWithURL, "base64")).toMatchSnapshot("zoom-one-out-with-keyboard-screenshot.png", {
    maxDiffPixelRatio: 0.01
  });
});
