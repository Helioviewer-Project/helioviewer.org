import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

import https from "https";

/**
 * This test is a regression test for proving issue 654 is fixed for the given helioviewer
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/654
 */
test("Issue 654, Hinode XRT selection creates notification can not be closed", async ({ page, browser }, info) => {
  // Use problem requests from production to replicate status
  await page.route("**/*action=*", async (route) => {
    const currentURL = new URL(route.request().url());
    const action = currentURL.searchParams.get("action");

    // only use from production for "getClosestImage" and "getDataSources" actions
    if (action === "getClosestImage" || action === "getDataSources") {
      currentURL.protocol = "https";
      currentURL.hostname = "api.helioviewer.org";

      // Fetch the new URL manually
      await https.get(currentURL.toString(), (response) => {
        let json = "";

        response.on("data", (chunk) => {
          json += chunk;
        });

        response.on("end", () => {
          route.fulfill({
            headers: {
              "content-type": "application/json",
              "User-Agent": "Playwright Tests for replicating issue #654"
            },
            body: json
          });
        });
      });
    } else {
      route.continue();
    }
  });

  // load helioviewer
  let hv = new Helioviewer(page, info);

  // // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.WaitForLoadingComplete();

  // // Action 2 : Open left sources panel
  await hv.OpenSidebar();

  // Action 3: Set application state to have Hinode/XRT selection
  await page.evaluate(() => {
    localStorage.setItem(
      "settings",
      '{"options":{"date":"latest","movies":{"cadence":"auto","duration":86400,"dialog":"default","format":"mp4"},"autorefresh":false,"movieautoplay":false,"showinviewport":false},"history":{"movies":[],"screenshots":[]},"notifications":{"coordinates":true,"welcome":false,"news":1735851140993},"state":{"centerX":0,"centerY":-0.30255511,"date":1735851140924,"drawers":{"#hv-drawer-left":{"open":true,"accordions":{"#accordion-date":{"open":true},"#accordion-images":{"open":true},"#accordion-events":{"open":true},"#accordion-bodies":{"open":true}}},"#hv-drawer-news":{"open":false,"accordions":{"#accordion-news":{"open":true}}},"#hv-drawer-youtube":{"open":false,"accordions":{"#accordion-youtube":{"open":true},"#accordion-youtube-current":{"open":false}}},"#hv-drawer-movies":{"open":false,"accordions":{"#accordion-movies":{"open":true}}},"#hv-drawer-screenshots":{"open":false,"accordions":{"#accordion-screenshots":{"open":true}}},"#hv-drawer-data":{"open":false,"accordions":{"#accordion-vso":{"open":true},"#accordion-sdo":{"open":true}}},"#hv-drawer-share":{"open":false,"accordions":{"#accordion-link":{"open":true},"#accordion-social":{"open":true}}},"#hv-drawer-help":{"open":false,"accordions":{"#accordion-help-links":{"open":true}}},"#hv-drawer-timeline":{"open":false},"#hv-drawer-timeline-events":{"open":false}},"events_v2":{"tree_HEK":{"id":"HEK","visible":true,"markers_visible":true,"labels_visible":true,"layer_available_visible":true,"layers":[]},"tree_CCMC":{"id":"CCMC","visible":true,"markers_visible":true,"labels_visible":true,"layer_available_visible":true,"layers":[]},"tree_RHESSI":{"id":"RHESSI","visible":true,"markers_visible":true,"labels_visible":true,"layer_available_visible":true,"layers":[]}},"eventLabels":true,"imageScale":4.84088176,"refScale":0.60511022,"scale":true,"scaleType":"earth","scaleX":1257,"scaleY":800,"tileLayers":[{"uiLabels":[{"label":"Observatory","name":"Hinode"},{"label":"Instrument","name":"XRT"},{"label":"Filter Wheel 1","name":"Al_poly"},{"label":"Filter Wheel 2","name":"Open"}],"Observatory":"Hinode","Instrument":"XRT","Filter Wheel 1":"Al_poly","Filter Wheel 2":"Open","visible":true,"opacity":100,"difference":0,"diffCount":60,"diffTime":1,"baseDiffTime":"2025-01-02T19:52:20.000Z","sourceId":48,"nickname":"XRT Al_poly/Open","layeringOrder":1,"start":"2006-10-28 10:30:55","end":"2023-11-24 23:59:50"}],"userTileLayers":[],"dropdownLayerSelectID":0,"timeStep":86400,"celestialBodiesChecked":{"soho":[],"stereo_a":[],"stereo_b":[]},"celestialBodiesAccordionOpen":{"soho":true,"stereo_a":true,"stereo_b":true},"celestialBodiesAvailableVisible":{"soho":true,"stereo_a":true,"stereo_b":true},"celestialBodiesLabelsVisible":{"soho":false,"stereo_a":false,"stereo_b":false},"celestialBodiesTrajectoriesVisible":{"soho":false,"stereo_a":false,"stereo_b":false},"containerX":1219.6875,"containerY":82.640625,"celestialBodiesVersion":3},"zoom":{"type":"continuous","focus":"cursor"},"version":700,"mobileZoomScale":1}'
    );
  });

  // Action 4: Reload helioviewer for the new state to be active
  await page.reload();
  await hv.WaitForLoadingComplete();

  // Observation time should be is far , notification should be visible
  await hv.assertNotification("warn", "The XRT Al_poly/Open layer is 404 days away from your observation time.");

  // Action 5: Close notification if you can achive
  await page.locator(".jGrowl-close").first().click();

  // Action 6: Assert we could be able to close the notification
  await hv.assertNoNotification();
});
