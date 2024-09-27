import { test, expect } from "@playwright/test";
import { HvMobile } from "../page_objects/mobile_hv";

test("Mobile - Displays initial AIA 304 Image", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.UseNewestImage();
  await mobile.WaitForLoad();
  await expect(page).toHaveScreenshot();
});
