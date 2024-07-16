import { test } from '@playwright/test';
import { Helioviewer } from '../../page_objects/helioviewer';

/**
 * This test simply adds and removes images layers
 */
test('Can add and remove image layers', async ({ page }) => {
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.ClickDataSourcesTab();
  await hv.UseNewestImage();
  await hv.AddImageLayer();
  await hv.RemoveImageLayer(0);
  await hv.AddImageLayer();
  await hv.WaitForLoadingComplete();
  // Expect LASCO C2 Layer to be present
  await hv.ExpectLayer(0, "LASCO C2", "SOHO", "LASCO", "white-light");

  // Expect AIA 304 Layer to be present
  await hv.ExpectLayer(1, "AIA 304", "SDO", "AIA", "304");
});

/**
 * Image presets have an effect on the application state.
 * After setting presets, we should be able to share the viewport.
 * Test Steps:
 *   0. Load page
 *   1. Create the LASCO C2 Layer
 *   2. Close the AIA layer (LASCO C2 has enough images for difference images, AIA does not.)
 *   3. Set the diffDate date
 *   4. Set the diffDate time
 *   5. Share Viewport
 */
test.only('Verify that you can share state after setting baseDiffTime', async ({page}) => {
  // 0. Load page
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.ClickDataSourcesTab();
  await hv.UseNewestImage();
  // 1/2. Create the LASCO C2 Layer, Remove the AIA layer
  await hv.AddImageLayer();
  await hv.RemoveImageLayer(0);
  // Expect LASCO C2 Layer to be present
  await hv.ExpectLayer(0, "LASCO C2", "SOHO", "LASCO", "white-light");
  // 3/4. Set diffDate date/time
  let layer = await hv.getImageLayer(0);
  await layer.set("Difference", "Base difference");
  await layer.setBaseDifferenceDate('2023/12/01', '00:30:00');
  // 5. Share viewport
  await hv.urlshare.triggerShareURL();
  await hv.urlshare.sharedURLIsVisibleAndDone();
});
