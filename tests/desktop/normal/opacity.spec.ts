import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../page_objects/helioviewer";

/**
 * This test drags the opacity slider to several places
 * and verifies that the opacity of the underlying image
 * matches the value set on the slider.
 */
test("Change opacity (1 layer)", async ({ page }) => {
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.OpenSidebar();
  let layer = await hv.getImageLayer(0);
  // setOpacity has internal expects that this test relies on.
  await layer.setOpacity(0);
  await layer.setOpacity(0.3);
  await layer.setOpacity(0.5);
  await layer.setOpacity(0.7);
  await layer.setOpacity(0.75);
  await layer.setOpacity(0.99);
  await layer.setOpacity(1);
});

/**
 * This test verifies the opacity on multiple layers can be set independently.
 */
test("Change opacity (2 layers)", async ({ page }) => {
  let hv = new Helioviewer(page);
  await hv.Load();
  await hv.OpenSidebar();
  await hv.AddImageLayer();
  let first_layer = await hv.getImageLayer(0);
  // setOpacity has internal expects that this test relies on.
  await first_layer.setOpacity(0.5);
  let second_layer = await hv.getImageLayer(1);
  await second_layer.setOpacity(0);
  let first_opacity = await first_layer.getOpacity();
  let second_opacity = await second_layer.getOpacity();
  await expect(first_opacity).not.toBe(second_opacity);
  await expect(first_opacity - second_opacity).toBeCloseTo(0.5, 1);
});
