import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test tests zoom out functionality with
 * - load helioviewer
 * - zoom one in
 * - take screenshot
 * - load helioviewer with clean state, with ?imageScale=2.42044088 indicating zoom 1 in scale value
 * - screenshot should match previous screenshot
 */
test("Pressing zoom in button should zoom sun in", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. ZOOM ONE IN
  await hv.ZoomIn(1);
  await hv.WaitForLoadingComplete();

  // 4. TAKE A SCREENSHOT
  await hv.sunScreenshot("zoom-one-in-with-button-screenshot.png");

  // 5. LOAD HELIOVIEWER WITH CLEAN STATE, WITH ?IMAGESCALE=2.42044088 INDICATING ZOOM 1 IN SCALE VALUE
  await page.evaluate(() => localStorage.clear());
  await hv.Load("/?imageScale=2.42044088");
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 6. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 7. TAKE ANOTHER SCREENSHOT
  const zoomOneInWithURL = await hv.sunScreenshot("zoom-one-in-with-url-screenshot");

  // 8. BOTH SCREENSHOT SHOULD MATCH
  expect(Buffer.from(zoomOneInWithURL, "base64")).toMatchSnapshot("zoom-one-in-with-button-screenshot.png", {
    maxDiffPixelRatio: 0.01
  });
});

/**
 * This test;
 * - load helioviewer
 * - zoom one in with keyboard + char
 * - take screenshot
 * - load helioviewer with clean state, with ?imageScale=9.68176352 indicating zoom 1 in scale value
 * - screenshot should match previous screenshot
 */
test("Pressing zoom in with keyboard + should zoom sun in", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  await hv.sunScreenshot("initial.png");

  // 3. ZOOM ONE IN WITH KEYBOARD "+"
  await page.keyboard.press("+");
  await hv.WaitForLoadingComplete();

  // 4. TAKE A SCREENSHOT
  await hv.sunScreenshot("zoom-one-in-with-keyboard-screenshot.png");

  // 5. LOAD HELIOVIEWER WITH CLEAN STATE, WITH ?IMAGESCALE=9.68176352 INDICATING ZOOM 1 OUT SCALE VALUE
  await page.evaluate(() => localStorage.clear());
  await hv.Load("/?imageScale=2.42044088");
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 6. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 7. TAKE ANOTHER SCREENSHOT
  const zoomOneInWithURL = await hv.sunScreenshot("zoom-one-in-with-url-screenshot");

  // 8. BOTH SCREENSHOT SHOULD MATCH
  expect(Buffer.from(zoomOneInWithURL, "base64")).toMatchSnapshot("zoom-one-in-with-keyboard-screenshot.png", {
    maxDiffPixelRatio: 0.01
  });
});
