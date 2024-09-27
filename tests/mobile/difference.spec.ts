import { test, expect } from "@playwright/test";
import { HvMobile } from "../page_objects/mobile_hv";

test("Test running difference", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.ZoomOut(3);
  await mobile.OpenImageLayerDrawer();
  let layer = await mobile.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await mobile.CloseDrawer();
  await mobile.UseNewestImage();
  await mobile.WaitForLoad();
  // Verify that the image layer is not using a difference image to start with.
  let tile = layer.getTile(0);
  await expect(tile).toHaveAttribute("src", /^.*difference=0.*$/);
  await mobile.OpenImageLayerDrawer();

  await layer.set("Difference", "Running difference");
  await layer.setRunningDifferenceValue(30);
  await mobile.CloseDrawer();
  // Let the page update
  await mobile.WaitForLoad();
  // Verify the image tag is now using a difference image
  await expect(tile).toHaveAttribute("src", /^.*difference=1.*$/);
});

test("Test base difference", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.ZoomOut(3);
  await mobile.OpenImageLayerDrawer();
  let layer = await mobile.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await mobile.CloseDrawer();
  await mobile.UseNewestImage();
  await mobile.WaitForLoad();
  // Verify that the image layer is not using a difference image to start with.
  let tile = layer.getTile(0);
  await expect(tile).toHaveAttribute("src", /^.*difference=0.*$/);
  await mobile.OpenImageLayerDrawer();
  await layer.set("Difference", "Base difference");
  // Let the page update
  await mobile.WaitForLoad();
  // Verify the image tag is now using a difference image
  await expect(tile).toHaveAttribute("src", /^.*difference=2.*$/);
});
