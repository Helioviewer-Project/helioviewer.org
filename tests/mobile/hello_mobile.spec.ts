import { test, expect } from '@playwright/test';

test('Mobile - Displays initial AIA 304 Image', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  await page.locator('.hvbottombar').getByText('NEWEST').click();
  // TODO: Mobile doesn't have a loading indicator we can wait on.
  await page.waitForTimeout(5000);
  await expect(page).toHaveScreenshot();
});
