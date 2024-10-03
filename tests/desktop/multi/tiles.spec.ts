import { test, expect } from "@playwright/test";
import { EmbedView, HelioviewerFactory, MinimalView, DesktopView } from "../../page_objects/helioviewer_interface";

[EmbedView, MinimalView, DesktopView].forEach((view) => {
  /**
   * A recurring issue in Helioviewer deals with computing which tiles should
   * be displayed in the viewport based on the screen size, zoom amount, and
   * the image container position. This test verifies that tiles are loaded
   * properly when the viewport region intersects with tile boundaries.
   *
   * This test was written for a bug tiles on the right edge of the viewport
   * are not loaded. This bug was reproducable with the following steps:
   * - Zoom In some amount
   * - Zoom out
   * - Observe that not all tiles are loaded and there are black areas where there should be images.
   *
   * This test verifies that the black space does NOT remain, and that the tile does get loaded
   * when it is dragged into the viewport.
   */
  test(
    `[${view.name}] Verify image tiles are loaded when the viewport pans to tile boundaries after zooming in and out`,
    { tag: view.tag },
    async ({ page }, info) => {
      let hv = HelioviewerFactory.Create(view, page, info);
      await hv.Load("/");
      await hv.CloseAllNotifications();
      // Zoom in to increase the number of tiles.
      await hv.ZoomIn(4);
      // Zoom out, to test the zoom out
      await hv.ZoomOut(1);
      // Tiles in column x=1 should be visible from y range y=-2 to y=1
      await expect(page.locator("//img[contains(@src, 'x=1&y=-2')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=1&y=-1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=1&y=0')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=1&y=1')]")).toHaveCount(1);
      // Same for tiles in column x=2
      await expect(page.locator("//img[contains(@src, 'x=2&y=-2')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=2&y=-1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=2&y=0')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=2&y=1')]")).toHaveCount(1);
      // Tiles in row y=1 should be visible from x range x=-3 to x=2
      await expect(page.locator("//img[contains(@src, 'x=-3&y=1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=-2&y=1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=-1&y=1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=0&y=1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=1&y=1')]")).toHaveCount(1);
      await expect(page.locator("//img[contains(@src, 'x=2&y=1')]")).toHaveCount(1);
    }
  );
});
