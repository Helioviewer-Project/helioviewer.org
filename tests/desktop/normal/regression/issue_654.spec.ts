import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

import * as https from "https";

/**
 * This test is a regression test for proving issue 654 is fixed for the given helioviewer
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/654
 */
test("Issue 654, Hinode XRT selection creates notification can not be closed", async ({ page, browser }, info) => {
  // load helioviewer
  let hv = new Helioviewer(page, info);

  // // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // // Action 2 : Open left sources panel
  await hv.OpenSidebar();

  const layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "Hinode");
  await hv.WaitForLoadingComplete();

  await page.waitForTimeout(3000);

  // Observation time should be is far , notification should be visible
  await hv.assertNotification("warn", /The XRT Al_poly\/Open layer is \d+ days away from your observation time./);

  // Action 5: Close notification if you can achive
  await page.locator(".jGrowl-close").first().click();

  // Action 6: Assert we could be able to close the notification
  await hv.assertNoNotification();
});
