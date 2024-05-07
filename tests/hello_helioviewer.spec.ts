import { test, expect } from '@playwright/test';

/**
 * Tests that a local instance of Helioviewer is up and running.
 */
test('has title', async ({ page }) => {
  await page.goto('http://localhost:8080/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Helioviewer\.org/);
});

/**
 * This test will make Helioviewer load the default AIA 304 image that is
 * embedded in the development container and perform a visual comparison to make
 * sure the page appears how we expect it to appear.
 */
test('Displays initial AIA 304 Image', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  // Open the Helioviewer Sidebar
  // Wait for the UI to finish loading before proceeding
  // TODO: This should not be a requirement to use Helioviewer.
  //       The fact that this is required for this test to pass consistently
  //       implies there is a race between the user taking an action on
  //       Helioviewer, and Helioviewer's initialization and HV being fully
  //       Initialized
  await page.waitForFunction(() => document.getElementById('loading')?.style.display == "none", null, {timeout: 60000});
  await page.locator('#hv-drawer-tab-left').click();
  // Enter the date and time for the default AIA 304 Image
  await page.getByLabel('Observation date', { exact: true }).click();
  await page.getByLabel('Observation date', { exact: true }).fill('2021/06/01');
  await page.getByLabel('Observation date', { exact: true }).press('Enter');
  await page.getByLabel('Observation time').click();
  await page.getByLabel('Observation time').fill('00:01:29');
  await page.getByLabel('Observation time').press('Enter');
  // Click out of the time editor
  await page.locator('#moving-container img').first().click();
  // Wait for the UI to finish loading
  await page.waitForFunction(() => document.getElementById('loading')?.style.display == "none", null, {timeout: 60000});
  // And the date text should turn green since the observation time matches the image time.
  await page.waitForFunction(() => {
    let tileSection = document.getElementById('TileLayerAccordion-Container');
    let timestamp = tileSection?.getElementsByClassName('timestamp');
    // Return true if the timestamp color is green.
    return (timestamp?.item(0) as HTMLSpanElement).style.color == "rgb(0, 255, 0)";
  });
  // Expect the AIA 304 layer to display the time we selected
  await expect(page.locator('#TileLayerAccordion-Container').getByText('2021/06/01 00:01:29 UTC')).toBeVisible();
  await expect(page).toHaveScreenshot();
});