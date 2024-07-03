import { test, expect } from '@playwright/test';
import { HvMobile } from '../page_objects/mobile_hv';
import exp from 'constants';

/**
 * This test simply adds and removes images layers
 */
test('Change opacity (1 layer)', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.OpenImageLayerDrawer();
  let layer = await mobile.getImageLayer(0);
  // // setOpacity has internal expects that this test relies on.
  await layer.setOpacity(0);
  await layer.setOpacity(0.3);
  await layer.setOpacity(0.5);
  await layer.setOpacity(0.7);
  await layer.setOpacity(0.75);
  await layer.setOpacity(0.99);
  await layer.setOpacity(1);
  await layer.setOpacity(0.3);
  // Closing drawer just so we can see the results in a trace.
  await mobile.CloseDrawer();
  await page.waitForTimeout(100);
});

test('Change opacity (2 layers)', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.OpenImageLayerDrawer();
  await mobile.AddImageLayer();
  let first_layer = await mobile.getImageLayer(0);
  // setOpacity has internal expects that this test relies on.
  await first_layer.setOpacity(0.5);
  let second_layer = await mobile.getImageLayer(1);
  await second_layer.setOpacity(0);
  // Closing drawer just so we can see the results in a trace.
  await mobile.CloseDrawer();
  await page.waitForTimeout(100);
  let first_opacity = await first_layer.getOpacity();
  let second_opacity = await second_layer.getOpacity();
  await expect(first_opacity).not.toBe(second_opacity);
  await expect(first_opacity - second_opacity).toBeCloseTo(0.5, 1);
});
