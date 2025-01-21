import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../page_objects/helioviewer";
import * as fs from "fs";

// loading of wrong url , is creating problems
test("Non-Existing Shared URLs Should Be Reported To User", async ({ page, context }, info) => {
  let hv = new Helioviewer(page);

  const response = await hv.Load("/load/DONOTEXIST");
  await hv.CloseAllNotifications();
  await expect(page).toHaveScreenshot();
});

/**
 * This test checks if shortURLs are correctly being overwritten by .htacces
 */
test("Shared URLs redirection should be done correctly", async ({ page }, info) => {
  let hv = new Helioviewer(page);

  await hv.Load();
  await hv.CloseAllNotifications();

  await page.locator("#share-button").click();

  await page.waitForTimeout(1000);

  await expect(page.locator("#hv-drawer-share")).toBeVisible();

  const shortURL = await page.locator("#helioviewer-share-url").inputValue();
  await hv.Load(shortURL);

  const loadURL = shortURL.split("/load/")[0];
  const loadID = shortURL.split("/load/")[1];

  await expect(`${loadURL}/?loadState=${loadID}`).toBe(page.url());
});

/**
 * This test plays through creating a short url and makes a test for short url should exactly resolved what is shared
 */
test("Shared URLs should produce pages, exactly like they shared", async ({ page, browserName }, info) => {
  test.fixme(
    browserName === "webkit",
    "We couldn't be able to trigger download event for webkit, skipping this test now"
  );
  let hv = new Helioviewer(page, info);

  await hv.Load();
  await hv.CloseAllNotifications();

  await page.locator("#share-button").click();

  await expect(page.locator("#hv-drawer-share")).toBeVisible();

  await expect(page.locator("#helioviewer-url-box-stale-link-msg")).not.toBeVisible();

  // Zoom in 4: times
  await hv.ZoomIn(4);

  // move mouse off of zoom button
  await page.mouse.move(100, 0);
  await hv.WaitForImageLoad();

  // Now it has to be visible
  await expect(page.locator("#helioviewer-url-box-stale-link-msg")).toBeVisible();

  await page.locator("#update-share-url-link").click();

  await expect(page.locator("#helioviewer-url-box-stale-link-success-msg")).toBeVisible();

  await page.waitForTimeout(500);

  await expect(page.locator("#helioviewer-url-box-stale-link-success-msg")).not.toBeVisible();

  const shortURL = await page.locator("#helioviewer-share-url").inputValue();

  // turn off screenshare
  await page.locator("#share-button").click();
  await page.mouse.move(100, 0);

  await hv.saveScreenshot("before-url-sharing-screenshot.png");

  await hv.Load(shortURL);
  await hv.CloseAllNotifications();

  const afterScreenshot = (await page.screenshot()).toString("base64");

  expect(Buffer.from(afterScreenshot, "base64")).toMatchSnapshot("before-url-sharing-screenshot.png", {
    maxDiffPixelRatio: 0.01
  });
});
