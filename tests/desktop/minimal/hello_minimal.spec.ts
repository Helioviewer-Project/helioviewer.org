import { test, expect } from '@playwright/test';

/**
 * This test will make Helioviewer load the default AIA 304 image that is
 * embedded in the development container and perform a visual comparison to make
 * sure the page appears how we expect it to appear.
 */
test('Displays initial AIA 304 Image', async ({ page }) => {
  await page.goto('/?debug&output=minimal');
  await page.getByLabel('Date').click();
  await page.getByLabel('Date').fill('2021/06/01');
  await page.getByLabel('Date').press('Tab');
  await page.locator('#time').fill('00:01:21');
  await page.locator('#time').press('Enter');
  await page.locator('#moving-container img').first().click();
});
