import { test, expect, Page } from '@playwright/test';

async function SetObservationTime(page: Page) {
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
}

test('Normal View: Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.', async ({ page }) => {
  await page.goto('/');
  // Close the initial notifications that come up
  // The first time visit tutorial & the image warning will show
  await page.getByText('[ close all ]').click();
  // Open the sidebar
  await page.locator('#hv-drawer-tab-left').click();
  // Set the observation time to the known time.
  await SetObservationTime(page);

  // Expect the warning to appear with the expected text
  await expect(page.getByText('The AIA 304 layer is 943 days')).toBeVisible();
});

test('Minimal View: Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.', async ({ page }) => {
  await page.goto('/?output=minimal');
  await page.getByLabel('Date').click();
  await page.getByLabel('Date').fill('2024/01/01');
  await page.getByLabel('Date').press('Enter');
  await page.getByRole('textbox', { name: 'Time' }).click();
  await page.getByRole('textbox', { name: 'Time' }).fill('00:00:00');
  await page.getByRole('textbox', { name: 'Time' }).press('Enter');
  await expect(page.getByText('The AIA 171 layer is 943 days')).toBeVisible();
  await expect(await page.getByText('The AIA 171 layer is 943 days').count()).toBe(1);
});

test('Embedded View: Helioviewer shows a warning when the image displayed is at least 6 hours away from the observation time.', async ({ page }) => {
  await page.goto('?output=embed&date=2024-01-01T00:00:00Z');
  // Expect the warning to appear with the expected text
  await expect(page.getByText('The AIA 304 layer is 943 days')).toBeVisible();
})