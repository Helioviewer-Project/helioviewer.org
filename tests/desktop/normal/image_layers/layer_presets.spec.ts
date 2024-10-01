import { expect, test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test will select preset "Eruption Monitor" then validates all layers have the accepted values for preset
 * Then it will load all layers again with the same values without selecting preset
 * Screenshot should match with the one taken from preset selection
 */
test("Image Layer Controls | presets should bring different layer configurations ", async ({
  page,
  context,
  browserName
}, info) => {
  test.fixme(
    browserName === "webkit",
    "We are skipping webkit for this test, since it couldn't take same screenshot of the same view"
  );

  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2: LOAD PRESET FOR 'Eruption Monitor'
  await hv.SelectImagePreset("Eruption Monitor");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. CHECK FIRST LAYER VALUES SHOULD HAVE VALUES FROM THE PRESET
  let layer_first = await hv.getImageLayer(0);
  layer_first.assert("Observatory:", "SDO");
  layer_first.assert("Instrument:", "AIA");
  layer_first.assert("Measurement:", "304");

  // 4. CHECK SECOND LAYER VALUES SHOULD HAVE VALUES FROM THE PRESET
  let layer_second = await hv.getImageLayer(1);
  layer_second.assert("Observatory:", "SOHO");
  layer_second.assert("Instrument:", "LASCO");
  layer_second.assert("Detector:", "C2");
  layer_second.assert("Measurement:", "white-light");

  // 5. CHECK THIRD LAYER VALUES SHOULD HAVE VALUES FROM THE PRESET
  let layer_third = await hv.getImageLayer(2);
  layer_third.assert("Observatory:", "SOHO");
  layer_third.assert("Instrument:", "LASCO");
  layer_third.assert("Detector:", "C3");
  layer_third.assert("Measurement:", "white-light");

  // 6. GET SNAPSHOT FOR IMAGE PRESET
  const presetSun = await hv.sunScreenshot();

  // 7. LOAD AGAIN HV WITH NO CONFIGURATION
  await page.evaluate(() => localStorage.clear());
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 8. SET FIRST LAYER VALUES EXACTLY LIKE IN THE PRESET
  layer_first = await hv.getImageLayer(0);
  layer_first.set("Observatory:", "SDO");
  layer_first.set("Instrument:", "AIA");
  layer_first.set("Measurement:", "304");

  // 9. ADD ANOTHER LAYER AS PRESET REQUIRES IT
  await hv.AddImageLayer();

  // 10. SET SECOND LAYER VALUES EXACTLY LIKE IN THE PRESET
  layer_second = await hv.getImageLayer(1);
  layer_second.set("Observatory:", "SOHO");
  layer_second.set("Instrument:", "LASCO");
  layer_second.set("Detector:", "C2");
  layer_second.set("Measurement:", "white-light");

  // 11. ADD ANOTHER LAYER AS PRESET REQUIRES IT
  await hv.AddImageLayer();

  // 12. SET SECOND LAYER VALUES EXACTLY LIKE IN THE PRESET
  layer_third = await hv.getImageLayer(2);
  layer_third.set("Observatory:", "SOHO");
  layer_third.set("Instrument:", "LASCO");
  layer_third.set("Detector:", "C3");
  layer_third.set("Measurement:", "white-light");

  // 13. WAIT EVERYTHING TO SETTLE
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 14. SCREENSHOT SHOULD MATCH WITH THE PRESET ONE
  expect(presetSun).toBe(await hv.sunScreenshot());
});
