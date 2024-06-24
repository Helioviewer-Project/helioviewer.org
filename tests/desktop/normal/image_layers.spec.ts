import { test, expect } from '@playwright/test';
import { Helioviewer } from '../common/helioviewer';

/**
 * This test simply adds and removes images layers
 */
test('Can add and remove image layers', async ({ page }) => {
  let hv = new Helioviewer(page);
  await page.goto('/');
  await hv.CloseAllNotifications();
  await hv.ClickDataSourcesTab();
  await hv.UseNewestImage();
  await hv.AddImageLayer();
  await hv.RemoveImageLayer(0);
  await hv.AddImageLayer();
  // Expect LASCO C2 Layer to be present
  await hv.ExpectLayer(0, "LASCO C2", "SOHO", "LASCO", "white-light");

  // Expect AIA 304 Layer to be present
  await hv.ExpectLayer(1, "AIA 304", "SDO", "AIA", "304");
});