import { expect, test } from "@playwright/test";
import { DesktopView, HelioviewerFactory, MobileInterface, MobileView } from "page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  /**
   * This test simply adds and removes images layers
   */
  test(`[${view.name}] Can add and remove image layers`, { tag: view.tag }, async ({ page }, info) => {
    let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;
    await hv.Load();
    await hv.CloseAllNotifications();
    await hv.UseNewestImage();
    await hv.OpenImageLayerDrawer();
    await hv.AddImageLayer();
    await hv.RemoveImageLayer(0);
    await hv.AddImageLayer();
    await hv.WaitForLoadingComplete();
    // Expect LASCO C2 Layer to be present
    await hv.ExpectLayer(0, "LASCO C2", "SOHO", "LASCO", "white-light");

    // Expect AIA 304 Layer to be present
    await hv.ExpectLayer(1, "AIA 304", "SDO", "AIA", "304");
  });

  /**
   * Image presets have an effect on the application state.
   * After setting presets, we should be able to share the viewport.
   * Test Steps:
   *   0. Load page
   *   1. Create the LASCO C2 Layer
   *   2. Close the AIA layer (LASCO C2 has enough images for difference images, AIA does not.)
   *   3. Set the diffDate date
   *   4. Set the diffDate time
   *   5. Share Viewport
   */
  test(
    `[${view.name}] Verify that you can share state after setting baseDiffTime`,
    { tag: view.tag },
    async ({ page }, info) => {
      // 0. Load page
      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.UseNewestImage();
      // 1/2. Create the LASCO C2 Layer, Remove the AIA layer
      await hv.OpenImageLayerDrawer();
      await hv.AddImageLayer();
      await hv.RemoveImageLayer(0);
      // Expect LASCO C2 Layer to be present
      await hv.ExpectLayer(0, "LASCO C2", "SOHO", "LASCO", "white-light");
      // 3/4. Set diffDate date/time
      let layer = await hv.getImageLayer(0);
      await layer.set("Difference", "Base difference");
      await layer.setBaseDifferenceDate("2023/12/01", "00:30:00");
      // 5. Share viewport
      await hv.urlshare.triggerShareURL();
      await hv.urlshare.sharedURLIsVisibleAndDone();
    }
  );

  /**
   * This tests that users can safely upgrade from baseDiffDates in the format "Y/m/d H:M:S"
   * to the ISO format "Y-m-dTH:M:S.###Z".
   * Old dates in storage will be automatically upgraded.
   * This test involves manipulating local storage.
   * Test Steps:
   *   1. Load helioviewer
   *   2. Set localStorage to have the LASCO C2 Layer with the old baseDiffTime format.
   *   3. Reload the page to load with the old format.
   *   4. Attempt to share the viewport
   *   5. Check that the baseDiffField values are correct
   */
  test(
    `[${view.name}] Verify that you can share state after upgrading from old baseDiffDate format`,
    { tag: view.tag },
    async ({ page }, info) => {
      // 1. Load page
      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;
      await hv.Load();
      // 2. Update localStorage
      await page.evaluate(() => {
        // @ts-ignore: Helioviewer exists on the Window when evaluated on the page.
        window.Helioviewer.userSettings.set("state.tileLayers", [
          {
            baseDiffTime: "2023/12/01 00:30:00",
            Detector: "C2",
            diffCount: 60,
            difference: 2,
            diffTime: 1,
            end: "2023-12-01 00:48:07",
            Instrument: "LASCO",
            layeringOrder: 2,
            Measurement: "white-light",
            nickname: "LASCO C2",
            Observatory: "SOHO",
            opacity: 100,
            sourceId: 4,
            start: "2023-12-01 00:00:07",
            uiLabels: [
              {
                label: "Observatory",
                name: "SOHO"
              },
              {
                label: "Instrument",
                name: "LASCO"
              },
              {
                label: "Detector",
                name: "C2"
              },
              {
                label: "Measurement",
                name: "white-light"
              }
            ],
            visible: "1"
          }
        ]);
      });
      // 3. Reload the page
      await hv.Load();
      // 4. Try Share viewport
      await hv.urlshare.triggerShareURL();
      await hv.urlshare.sharedURLIsVisibleAndDone();
      // 5. Check that values are correct
      let layer = await hv.getImageLayer(0);
      let date = await layer.getBaseDifferenceDate();
      expect(date).toBe("2023/12/01");
      let time = await layer.getBaseDifferenceTime();
      expect(time).toBe("00:30:00");
    }
  );
});
