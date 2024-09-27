import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../page_objects/helioviewer";

test("Test running difference", async ({ page }) => {
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.ZoomOut(3);
  await hv.OpenSidebar();
  let layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.UseNewestImage();
  await hv.WaitForImageLoad();
  // Verify that the image layer is not using a difference image to start with.
  let tile = layer.getTile(0);
  await expect(tile).toHaveAttribute("src", /^.*difference=0.*$/);
  await layer.set("Difference", "Running difference");
  await layer.setRunningDifferenceValue(30);
  await hv.WaitForImageLoad();
  // Verify the image tag is now using a difference image
  await expect(tile).toHaveAttribute("src", /^.*difference=1.*$/);
});

test("Test base difference", async ({ page }) => {
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.ZoomOut(3);
  await hv.OpenSidebar();
  let layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.UseNewestImage();
  await hv.WaitForImageLoad();
  let tile = layer.getTile(0);
  // Verify that the image layer is not using a difference image to start with.
  await expect(tile).toHaveAttribute("src", /^.*difference=0.*$/);
  await layer.set("Difference", "Base difference");
  // Verify the image tag is now using a difference image
  await expect(tile).toHaveAttribute("src", /^.*difference=2.*$/);
});
