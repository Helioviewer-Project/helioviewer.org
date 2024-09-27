import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../page_objects/helioviewer";

/**
 * This test will make Helioviewer load the default AIA 304 image that is
 * embedded in the development container and perform a visual comparison to make
 * sure the page appears how we expect it to appear.
 *
 * @note This test is sometimes flaky due to race conditions in Helioviewer.
 *       Consider this:
 *          1. We update observation date, helioviewer starts updating
 *          2. We update observation time before the page is done updating
 *          - Helioviewer is driven by callbacks, and (at this time 2024-09-13)
 *            there are no checks to make sure this happens sequentially,
 *            which may temporarily put helioviewer in the incorrect state.
 *            There's not a simple solution to this, but consider this if you
 *            see this test being flaky.
 */
test("Displays initial AIA 304 Image", { tag: "@flaky" }, async ({ page }) => {
  let hv = new Helioviewer(page);
  await page.goto("/");
  // Open the Helioviewer Sidebar
  // Wait for the UI to finish loading before proceeding
  // TODO: This should not be a requirement to use Helioviewer.
  //       The fact that this is required for this test to pass consistently
  //       implies there is a race between the user taking an action on
  //       Helioviewer, and Helioviewer's initialization and HV being fully
  //       Initialized
  await hv.WaitForLoadingComplete();
  await page.locator("#hv-drawer-tab-left").click();
  // Enter the date and time for the default AIA 304 Image
  await page.getByLabel("Observation date", { exact: true }).click();
  await page.getByLabel("Observation date", { exact: true }).fill("2021/06/01");
  await page.getByLabel("Observation date", { exact: true }).press("Enter");
  await page.getByLabel("Observation time").click();
  await page.getByLabel("Observation time").fill("00:01:29");
  await page.getByLabel("Observation time").press("Enter");
  // Click out of the time editor
  await page.locator("#moving-container img").first().click();
  // Wait for the UI to finish loading
  await hv.WaitForLoadingComplete();
  // And the date text should turn green since the observation time matches the image time.
  await page.waitForFunction(() => {
    let tileSection = document.getElementById("TileLayerAccordion-Container");
    let timestamp = tileSection?.getElementsByClassName("timestamp");
    // Return true if the timestamp color is green.
    return (timestamp?.item(0) as HTMLSpanElement).style.color == "rgb(0, 255, 0)";
  });
  // Expect the AIA 304 layer to display the time we selected
  await expect(page.locator("#TileLayerAccordion-Container").getByText("2021/06/01 00:01:29 UTC")).toBeVisible();
  await expect(page).toHaveScreenshot();
});
