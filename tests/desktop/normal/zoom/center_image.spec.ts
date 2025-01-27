import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test;
 * - load helioviewer
 * - take screenshot
 * - drag sun to random place
 * - press c to center sun
 * - centered sun should match initial sun
 */
test("Pressing C should center sun", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. TAKE A SCREENSHOT
  const initialCenteredSun = await hv.sunScreenshot();

  // 4. NOW PULL PAGE TO SOMEWHERE
  await hv.moveViewport(300, 30);

  // 5. CENTER VIEWPORT WITH PRESSING C
  await page.keyboard.press("c");

  // 6. TAKE ANOTHER SCREENSHOT
  const centeredWithKeyboard = await hv.sunScreenshot();

  // 7. BOTH SCREENSHOT SHOULD MATCH

  expect(initialCenteredSun).toBe(centeredWithKeyboard);
});

/**
 * This test;
 * - load helioviewer
 * - take screenshot
   - drag sun to random place
   - press sun center button to center sun
   - centered sun should match initial sun
 */
test("Pressing sun center button should center sun", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. TAKE A SCREENSHOT
  const initialCenteredSun = await hv.sunScreenshot();

  // 4. NOW PULL PAGE TO SOMEWHERE
  await hv.moveViewport(300, 30);

  // 5. CENTER VIEWPORT WITH PRESSING SUN CENTER BuTTON
  await hv.CenterViewport();

  // 6. TAKE ANOTHER SCREENSHOT
  const centeredWithButton = await hv.sunScreenshot();

  // 7. BOTH SCREENSHOT SHOULD MATCH

  expect(initialCenteredSun).toBe(centeredWithButton);
});
