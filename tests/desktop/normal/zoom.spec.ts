import { test, expect } from '@playwright/test';
import { Helioviewer } from '../common/helioviewer';

/**
 * This test simply adds and removes images layers
 */
test('Zoom scale is persisted across reload', async ({ page }, info) => {
  let hv = new Helioviewer(page);
  await page.goto('/');
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  // Zoom in 5 times
  await hv.ZoomIn(5);
  await hv.WaitForLoadingComplete();
  await page.screenshot({path: info.snapshotDir + '/zoom_screenshot.png'});
  await page.goto('/');
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  await expect(page).toHaveScreenshot(['zoom_screenshot.png']);
});
