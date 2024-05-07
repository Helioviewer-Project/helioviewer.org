import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  // Close the initial notifications that come up
  // The first time visit tutorial & the image warning will show
  await page.getByText('[ close all ]').click();
  // Open the sidebar
  await page.locator('#hv-drawer-tab-left').click();
  // Set the observation time to 00:00:00
  await page.getByLabel('Observation time').click();
  await page.getByLabel('Observation time').fill('00:00:00');
  // Switch to the date
  await page.getByLabel('Observation time').press('Shift+Tab');
  // Set the date time to 2024/01/01
  await page.getByLabel('Observation date', { exact: true }).fill('2024/01/01');
  await page.getByLabel('Observation date', { exact: true }).press('Enter');
  // Wait for the UI to finish loading
  await page.waitForFunction(() => document.getElementById('loading')?.style.display == "none", null, {timeout: 60000});
  // Expect the warning to appear with the expected text
  await expect(page.getByText('The AIA 304 layer is 943 days')).toBeVisible();
});