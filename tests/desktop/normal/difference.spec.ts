import { test, expect } from '@playwright/test';
import { Helioviewer } from '../../page_objects/helioviewer';

test('Test running difference', async ({ page }) => {
  let mobile = new Helioviewer(page);
  await mobile.Load();
  await mobile.ZoomOut(3);
  await mobile.OpenSidebar();
  let layer = await mobile.getImageLayer(0);
  // Verify that the image layer is not using a difference image to start with.
  let tile = layer.getTile(0);
  await expect(tile).toHaveAttribute("src", /^.*difference=0.*$/)
  await layer.set('Observatory:', 'SOHO');
  await mobile.UseNewestImage();
  await layer.set('Difference', 'Running difference');
  await layer.setRunningDifferenceValue(30);
  // Verify the image tag is now using a difference image
  await expect(tile).toHaveAttribute("src", /^.*difference=1.*$/)
});

test('Test base difference', async ({ page }) => {
  let mobile = new Helioviewer(page);
  await mobile.Load();
  await mobile.ZoomOut(3);
  await mobile.OpenSidebar();
  let layer = await mobile.getImageLayer(0);
  // Verify that the image layer is not using a difference image to start with.
  let tile = layer.getTile(0);
  await expect(tile).toHaveAttribute("src", /^.*difference=0.*$/)
  await layer.set('Observatory:', 'SOHO');
  await mobile.UseNewestImage();
  await mobile.WaitForImageLoad();
  await layer.set('Difference', 'Base difference');
  // Verify the image tag is now using a difference image
  await expect(tile).toHaveAttribute("src", /^.*difference=2.*$/)
});
