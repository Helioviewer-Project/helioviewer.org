import { expect, test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test tries to validate switching observatory for image layers.
 * It first loads SDO layer initially takes a screenshot of the SUN
 * then try to load SOHO waits then loads SDO again  ,
 * compare latest sdo screenshot and initial screenshot.
 */
test("Image Layer Controls | observatory changes should produce consistent matching images", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. TAKE SUNSCREENSOT
  const initialScreenshotSDO = await hv.sunScreenshot("initial_sdo");

  // 3. CHANGE LAYER 0 TO SOHO
  const layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 4. ASSERT SUN SHOULD CHANGE AND NOT MATCH
  expect(initialScreenshotSDO).not.toBe(await hv.sunScreenshot("change_to_sdo"));

  // 5. GO BACK TO SDO AGAIN
  await layer.set("Observatory:", "SDO");
  // TODO : FIX possible problem of Measurement selection
  await layer.set("Measurement:", "304");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // ASSERT SCRENSHOTS SHOULD MATCH NOW
  expect(initialScreenshotSDO).toBe(await hv.sunScreenshot("revisit_sdo"));
});

/**
 * This test tries to validate switching measurement for image layers.
 * It first loads SDO layer with 304 measurement takes a screenshot
 * then try to switch measurement to 171 and theen to 304 again compare latest sdo screenshot and initial screenshot.
 */
test("Image Layer Controls | measurement changes should produce consistent matching images", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. TAKE SUNSCREENSOT
  const sdo304 = await hv.sunScreenshot("initial_sdo_304");

  // 3. CHANGE LAYER 0 TO AIA 171
  const layer = await hv.getImageLayer(0);
  await layer.set("Measurement:", "171");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 4 ASSERT 171 and 304 NOT MATCH
  expect(sdo304).not.toBe(await hv.sunScreenshot("sdo_171"));

  // 4. GO BACK TO SDO AGAIN
  await layer.set("Measurement:", "304");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // SCRENSHOTS SHOULD MATCH
  expect(sdo304).toBe(await hv.sunScreenshot("revisit_sdo"));
});
